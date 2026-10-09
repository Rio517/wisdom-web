// The hike's water: one canvas between the map's flat background and its trail,
// trees and labels, loaded only once the hike is shown. Plain WebGL 2: five
// pieces (lake, pool, side stream, main stream, fall), one draw call each, no
// textures. The streams carry soft bands drifting downstream, small glints of
// light and a slightly deeper middle; the fall is a sheet of sliding streaks
// with foam where it lands; rings spread on the pool and the lake.
//
// Each piece writes how far a pixel is from its own bank as depth, so where
// pieces overlap (the side stream entering the main one, the pool) the piece
// whose middle it is wins and the banks join without a seam. The fall is drawn
// last and above everything, so the pool's far rim never shows through its foot.
//
// Without WebGL 2, or when the context is lost, the layer shows a still Canvas
// 2D drawing of the same water instead. With reduced motion it shows one still
// frame. It pauses while the map is off screen, covered or the tab is hidden.
import {
  MAIN, SIDE, STREAMS, POOL, LAKE, LAKE_SHORE, LAKE_RINGS, FALL, IMPACT, HILL, SOURCE_CREST,
  fallEdges, insetLoop, ellipseLoop, outline, bankWidth, fit,
} from './journey-hike-geometry.js';

const STILL_TIME = 1.7; // the moment the rings and streaks read best when nothing moves
const FLOW_SPEED = 24; // near map units per second; the walkers move at about 130
const FRINGE = 1.6; // map units of soft outer edge
const FALL_Z = 40; // above every other piece's depth

// ——— Colours: the water tokens in tokens.css, read from the page ———
const WATER = ['bank', 'body', 'deep', 'light', 'fall', 'ring'];
const rgb = hex => [0, 2, 4].map(i => parseInt(hex.slice(1 + i, 3 + i), 16) / 255);
function waterColors(element) {
  const style = getComputedStyle(element);
  const read = name => {
    const value = style.getPropertyValue(`--color-${name}`).trim();
    if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`Missing colour token ${name}`);
    return rgb(value);
  };
  const colors = Object.fromEntries(WATER.map(name => [name, read(`water-${name}`)]));
  colors.foam = read('paper');
  return colors;
}
const cssColor = ([r, g, b], alpha = 1) => `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${alpha})`;

// ——— WebGL ———
const VERTEX = `#version 300 es
in vec3 aPos;
in vec4 aData;
uniform vec4 uView;
out vec4 vData;
out vec2 vPos;
void main() {
  vData = aData;
  vPos = aPos.xy;
  gl_Position = vec4(aPos.xy * uView.xy + uView.zw, -aPos.z / 64.0, 1.0);
}`;

// `inside` is a soft outer edge over about one device pixel; `glint` is a small
// soft fleck in a sparse grid of cells that drift and fade in and out.
const COMMON = `#version 300 es
precision highp float;
uniform float uTime;
uniform vec3 uBank, uBody, uDeep, uBand, uFoam, uRing;
in vec4 vData;
in vec2 vPos;
out vec4 fragColor;
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float inside(float edge) {
  float aa = max(fwidth(edge), 1e-3);
  return smoothstep(-aa, aa * 0.5, edge);
}
float glint(vec2 cellSpace, float seed, float density) {
  vec2 cell = floor(cellSpace), f = fract(cellSpace) - 0.5;
  float r = hash(cell + seed);
  float life = 0.5 + 0.5 * sin(uTime * (1.1 + r) + r * 60.0);
  vec2 jitter = vec2(hash(cell + seed + 3.1), hash(cell + seed + 7.7)) - 0.5;
  float shape = 1.0 - smoothstep(0.0, 1.0, length((f - jitter * 0.4) / vec2(0.34, 0.2)));
  return step(1.0 - density, r) * shape * life * life;
}
`;

// vData: across (-1..1), distance in from the bank, flow distance, half width.
// The main stream is hidden above the green hill's crest, so it starts there.
const STREAM = `${COMMON}
uniform float uClip, uFlowSpeed;
uniform vec2 uCrestA, uCrestB, uCrestC;
float crest(float x) {
  if (x <= uCrestA.x || x >= uCrestC.x) return -1e4;
  if (x <= uCrestB.x) return mix(uCrestA.y, uCrestB.y, (x - uCrestA.x) / (uCrestB.x - uCrestA.x));
  return mix(uCrestB.y, uCrestC.y, (x - uCrestB.x) / (uCrestC.x - uCrestB.x));
}
void main() {
  float across = vData.x, edge = vData.y, flow = vData.z, halfWidth = vData.w;
  float alpha = inside(edge);
  if (uClip > 0.5) alpha *= inside(vPos.y - crest(vPos.x));
  if (alpha < 0.003) discard;
  float bank = 0.6 + 0.24 * halfWidth;
  float bankMix = 1.0 - smoothstep(bank * 0.55, bank * 1.3, edge);
  float centre = clamp(edge / max(halfWidth, 1e-3), 0.0, 1.0);
  float drift = uTime * uFlowSpeed;
  float n = noise(vec2((flow - drift) * 0.026, across * 2.3)) * 0.62
          + noise(vec2((flow - drift * 1.35) * 0.041 + 3.7, across * 3.3 + 1.3)) * 0.38;
  vec3 color = mix(mix(uBody, uDeep, smoothstep(0.1, 0.95, centre)), uBand, smoothstep(0.44, 0.74, n) * 0.48);
  float g = glint(vec2((flow - drift * 1.1) / 15.0, across * 2.6 + 2.6), 11.0, 0.24);
  color = mix(color, uFoam, g * (1.0 - bankMix));
  fragColor = vec4(mix(color, uBank, bankMix), alpha);
}`;

// vData.x: distance in from the shore (map units), negative outside.
const POND = `${COMMON}
uniform vec2 uCenter, uRingSize;
uniform vec4 uSources;
uniform float uDepth, uRingCycle, uFoamOn, uBankWidth;
float rimDistance(vec2 d, vec2 radius) {
  float r = length(d / radius);
  float g = length(d / (radius * radius));
  return r < 1e-3 ? min(radius.x, radius.y) : (1.0 - r) * r / max(g, 1e-5);
}
float ring(vec2 source, float phase) {
  float line = abs(rimDistance(vPos - source, uRingSize * mix(0.12, 1.0, phase)));
  return (1.0 - smoothstep(0.35, 1.1, line)) * (1.0 - phase) * smoothstep(0.0, 0.12, phase);
}
void main() {
  float edge = vData.x;
  float alpha = inside(edge);
  if (alpha < 0.003) discard;
  float bankMix = 1.0 - smoothstep(uBankWidth * 0.55, uBankWidth * 1.3, edge);
  vec3 color = mix(uBody, uDeep, smoothstep(0.1, 1.0, clamp(edge / uDepth, 0.0, 1.0)) * 0.8);
  float rings = 0.0;
  for (int i = 0; i < 2; i++) {
    rings += ring(i == 0 ? uSources.xy : uSources.zw, fract(uTime / uRingCycle + float(i) * 0.5));
  }
  color = mix(color, uRing, clamp(rings, 0.0, 1.0) * 0.6);
  if (uFoamOn > 0.5) {
    vec2 f = (vPos - uCenter + vec2(0.0, 1.5)) / vec2(28.0, 6.2);
    float churn = noise(vec2(atan(f.y, f.x) * 2.2 + uTime * 0.7, uTime * 0.5)) - 0.5;
    float foam = 1.0 - smoothstep(0.78, 1.0, length(f) + churn * 0.42);
    float flecks = step(0.72, noise(vPos * vec2(0.32, 0.9) + vec2(uTime * 0.6, 0.0))) * (1.0 - smoothstep(1.0, 1.9, length(f)));
    color = mix(color, uFoam, max(foam, flecks * 0.8));
  }
  float g = glint((vPos - uCenter) / vec2(15.0, 4.2) + vec2(uTime * 0.12, 0.0), 23.0, 0.16);
  color = mix(color, uFoam, g * (1.0 - bankMix));
  fragColor = vec4(mix(color, uBank, bankMix), alpha);
}`;

// vData: across (0..1 inside), down (0..1), width. Long soft streaks slide down the
// sheet; the lip and the foot are white water, and a lighter shimmer travels down.
const SHEET = `${COMMON}
uniform vec3 uSheet;
uniform float uLength;
void main() {
  float across = vData.x, down = vData.y, width = vData.z;
  float edge = min(across, 1.0 - across) * width;
  float alpha = inside(edge) * inside(down * uLength) * (1.0 - smoothstep(0.955, 1.0, down));
  if (alpha < 0.003) discard;
  float bankMix = (1.0 - smoothstep(0.7, 2.0, edge)) * (1.0 - smoothstep(0.9, 0.96, down));
  float n = noise(vec2(across * 7.0, vPos.y * 0.024 - uTime * 0.9)) * 0.62
          + noise(vec2(across * 12.0 + 4.0, vPos.y * 0.041 - uTime * 1.25)) * 0.38;
  vec3 color = mix(uSheet, uFoam, smoothstep(0.5, 0.72, n) * 0.9);
  color = mix(color, uFoam, (1.0 - smoothstep(0.0, 0.05, down)) * 0.6);
  color = mix(color, uFoam, smoothstep(0.86, 0.975, down) * 0.85);
  float shimmer = 0.5 + 0.5 * sin((vPos.y / 36.0 - uTime * 0.5) * 6.2832 + across * 2.0);
  color = mix(color, uFoam, shimmer * shimmer * 0.22);
  fragColor = vec4(mix(color, uBank, bankMix), alpha);
}`;

// A stream ribbon: three vertices across (bank, middle, bank) at every sample.
function streamMesh({ samples }) {
  const n = samples.length;
  const pos = new Float32Array(n * 9);
  const data = new Float32Array(n * 12);
  samples.forEach((p, i) => {
    const half = p.w / 2;
    [-1, 0, 1].forEach((side, j) => {
      const reach = side ? half + FRINGE : 0;
      const edge = side ? -FRINGE : half;
      const v = i * 3 + j;
      pos.set([p.x + p.nx * reach * side, p.y + p.ny * reach * side, edge], v * 3);
      data.set([side * (1 + FRINGE / half), edge, p.flow, half], v * 4);
    });
  });
  const index = [];
  for (let i = 0; i < n - 1; i += 1) {
    for (let j = 0; j < 2; j += 1) {
      const a = i * 3 + j;
      index.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
    }
  }
  return { pos, data, index };
}

// A pond from its shore outline: a strip round the shore whose edge value is the exact
// distance in from the shore, then triangles in to a spine along the pond's length,
// whose edge value is the spine point's distance to the shore. Depth is the edge value
// too, so the middle is highest. Works for the oval pool and the uneven lake alike.
function pondMesh(loop, { inset = 2.5, spineEnd }) {
  const n = loop.length;
  const outer = insetLoop(loop, -FRINGE);
  const inner = insetLoop(loop, inset);
  const xs = loop.map(p => p[0]);
  const ys = loop.map(p => p[1]);
  const left = Math.min(...xs) + spineEnd;
  const right = Math.max(...xs) - spineEnd;
  const midY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const shoreDistance = (x, y) => Math.min(...loop.map(([px, py]) => Math.hypot(px - x, py - y)));
  const pos = new Float32Array(n * 9);
  const data = new Float32Array(n * 12);
  loop.forEach(([x], i) => {
    const sx = Math.max(left, Math.min(right, x));
    const depth = Math.max(inset + 0.5, shoreDistance(sx, midY));
    pos.set([outer[i][0], outer[i][1], -FRINGE, inner[i][0], inner[i][1], inset, sx, midY, depth], i * 9);
    data.set([-FRINGE, 0, 0, 0, inset, 0, 0, 0, depth, 0, 0, 0], i * 12);
  });
  const index = [];
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    for (let row = 0; row < 2; row += 1) {
      const a = i * 3 + row;
      const b = j * 3 + row;
      index.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  return { pos, data, index };
}

// The fall's sheet: rows from the notch in the rock's lip down into the pool. Row 0 is
// the soft fringe just above the lip.
function sheetMesh() {
  const rows = 16;
  const length = FALL.bottom - FALL.top;
  const pos = new Float32Array((rows + 2) * 6);
  const data = new Float32Array((rows + 2) * 8);
  for (let r = 0; r <= rows + 1; r += 1) {
    const f = r === 0 ? -FRINGE / length : (r - 1) / rows;
    const y = FALL.top + length * f;
    const [left, right] = fallEdges(Math.max(0, f));
    const width = right - left;
    pos.set([left - FRINGE, y, FALL_Z, right + FRINGE, y, FALL_Z], r * 6);
    data.set([-FRINGE / width, f, width, 0, 1 + FRINGE / width, f, width, 0], r * 8);
  }
  const index = [];
  for (let r = 0; r <= rows; r += 1) index.push(r * 2, r * 2 + 2, r * 2 + 1, r * 2 + 1, r * 2 + 2, r * 2 + 3);
  return { pos, data, index };
}

function webglWater(canvas, colors) {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: true, stencil: false, powerPreference: 'low-power' });
  if (!gl) throw new Error('WebGL 2 is not available');
  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  const shader = (type, source) => {
    const object = gl.createShader(type);
    gl.shaderSource(object, source);
    gl.compileShader(object);
    return object;
  };
  const vertex = shader(gl.VERTEX_SHADER, VERTEX);
  const programs = [STREAM, POND, SHEET].map(source => {
    const program = gl.createProgram();
    const fragment = shader(gl.FRAGMENT_SHADER, source);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'aPos');
    gl.bindAttribLocation(program, 1, 'aData');
    gl.linkProgram(program);
    return { program, fragment };
  });

  const shared = {
    uBank: colors.bank, uBody: colors.body, uDeep: colors.deep, uBand: colors.light, uFoam: colors.foam, uRing: colors.ring,
  };
  const streamUniforms = clip => ({
    uClip: clip ? 1 : 0, uFlowSpeed: FLOW_SPEED, uCrestA: SOURCE_CREST[0], uCrestB: SOURCE_CREST[1], uCrestC: SOURCE_CREST[2],
  });
  const pondUniforms = ({ cx, cy }, sources, ringSize, cycle, foam, bank, depth) => ({
    uCenter: [cx, cy], uSources: sources.flat(), uRingSize: ringSize, uRingCycle: cycle, uFoamOn: foam ? 1 : 0, uBankWidth: bank, uDepth: depth,
  });
  const impact = [IMPACT[0], IMPACT[1] + 2];
  const pieces = [
    [1, pondMesh(LAKE_SHORE, { spineEnd: 12 }), pondUniforms(LAKE, LAKE_RINGS, [40, 9.5], 5.6, false, 4.2, 18)],
    [1, pondMesh(ellipseLoop(POOL), { spineEnd: POOL.ry }), pondUniforms(POOL, [impact, impact], [POOL.rx - 4, POOL.ry - 2], 4.2, true, 3, 12)],
    [0, streamMesh(SIDE), streamUniforms(false)],
    [0, streamMesh(MAIN), streamUniforms(true)],
    [2, sheetMesh(), { uSheet: colors.fall, uLength: FALL.bottom - FALL.top }],
  ].map(([which, mesh, uniforms]) => {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffer = (target, array) => {
      gl.bindBuffer(target, gl.createBuffer());
      gl.bufferData(target, array, gl.STATIC_DRAW);
    };
    buffer(gl.ARRAY_BUFFER, mesh.pos);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    buffer(gl.ARRAY_BUFFER, mesh.data);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
    buffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.index));
    gl.bindVertexArray(null);
    return { which, vao, count: mesh.index.length, uniforms: { ...shared, ...uniforms } };
  });

  // Uniform locations, looked up once the programs have linked.
  let ready = false;
  const setters = new Map();
  function link() {
    for (const { program, fragment } of programs) {
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`Water shader: ${gl.getShaderInfoLog(fragment) || gl.getProgramInfoLog(program)}`);
      }
    }
    for (const piece of pieces) {
      const { program } = programs[piece.which];
      piece.program = program;
      piece.set = Object.entries(piece.uniforms).map(([name, value]) => {
        const location = gl.getUniformLocation(program, name);
        if (typeof value === 'number') return () => gl.uniform1f(location, value);
        const array = new Float32Array(value);
        const method = [null, null, 'uniform2fv', 'uniform3fv', 'uniform4fv'][array.length];
        return () => gl[method](location, array);
      });
      if (!setters.has(program)) {
        setters.set(program, { time: gl.getUniformLocation(program, 'uTime'), view: gl.getUniformLocation(program, 'uView') });
      }
    }
    gl.deleteShader(vertex);
    programs.forEach(({ fragment }) => gl.deleteShader(fragment));
    ready = true;
  }
  // Shaders compile in the background where the browser can, so the page never waits on them.
  const compiled = () => !parallel || programs.every(({ program }) => gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR));

  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0, 0, 0, 0);
  const view = new Float32Array(4);

  return {
    kind: 'webgl',
    // True once the shaders are ready to draw; false while they still compile.
    prepare() {
      if (!ready && compiled()) link();
      return ready;
    },
    resize(width, height, dpr) {
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      // Map units to clip space, through the same box as the SVG layers.
      const { k, ox, oy } = fit(width, height);
      view.set([2 * k / width, -2 * k / height, 2 * ox / width - 1, 1 - 2 * oy / height]);
    },
    draw(time) {
      if (!ready) return;
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      for (const piece of pieces) {
        gl.useProgram(piece.program);
        const { time: timeAt, view: viewAt } = setters.get(piece.program);
        gl.uniform1f(timeAt, time);
        gl.uniform4fv(viewAt, view);
        for (const set of piece.set) set();
        gl.bindVertexArray(piece.vao);
        gl.drawElements(gl.TRIANGLES, piece.count, gl.UNSIGNED_SHORT, 0);
      }
      gl.bindVertexArray(null);
    },
  };
}

// ——— The still drawing, without WebGL: flat layered fills in Canvas 2D ———
// A darker bank and a lighter body, with light dashes along the streams, streaks
// down the sheet, foam at its foot and rings on the pool and the lake, as they
// stand at STILL_TIME.
const LANES = [
  { across: -0.5, period: 132, dash: 20, phase: 0, minWidth: 11 },
  { across: 0.04, period: 158, dash: 30, phase: 61, minWidth: 0 },
  { across: 0.46, period: 118, dash: 16, phase: 97, minWidth: 11 },
];
const FALL_COLUMNS = [0.2, 0.42, 0.6, 0.8];

function stillWater(canvas, colors) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  const TAU = Math.PI * 2;
  const fill = name => cssColor(colors[name]);
  const polygon = points => {
    const path = new Path2D();
    points.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));
    path.closePath();
    return path;
  };
  const ellipse = (cx, cy, rx, ry) => {
    const path = new Path2D();
    path.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
    return path;
  };
  const fallEdge = (y, side) => fallEdges(Math.max(0, Math.min(1, (y - FALL.top) / (FALL.bottom - FALL.top))))[side < 0 ? 0 : 1];
  const fallOutline = (inset, top = 0) => {
    const rows = Array.from({ length: 17 }, (_, i) => FALL.top + top + (FALL.bottom - FALL.top - top) * (i / 16));
    return [...rows.map(y => [fallEdge(y, -1) + inset, y]), ...rows.reverse().map(y => [fallEdge(y, 1) - inset, y])];
  };
  // The main stream is clipped to the green hill, so it starts at the hill's crest.
  const hill = new Path2D(HILL);
  const streams = STREAMS.map(stream => ({
    stream,
    clip: stream === MAIN,
    bank: polygon(outline(stream)),
    body: polygon(outline(stream, p => bankWidth(p.w))),
  }));
  const poolBank = bankWidth(POOL.ry * 2) * 0.8;
  const fallShape = polygon(fallOutline(0));
  const lakeBody = polygon(insetLoop(LAKE_SHORE, 3.2));
  const poolBody = ellipse(POOL.cx, POOL.cy, POOL.rx - poolBank, POOL.ry - poolBank);
  const time = STILL_TIME;

  function dashes(piece) {
    const { stream } = piece;
    const { samples } = stream;
    const end = stream === SIDE ? stream.flowLength - 14 : stream.flowLength;
    const indexAt = value => {
      const found = samples.findIndex(p => p.flow >= value);
      return found < 0 ? samples.length - 1 : found;
    };
    ctx.save();
    if (piece.clip) ctx.clip(hill);
    ctx.strokeStyle = fill('light');
    ctx.lineCap = 'round';
    for (const lane of LANES) {
      for (let start = ((lane.phase + time * FLOW_SPEED) % lane.period) - lane.period; start < end; start += lane.period) {
        const a = Math.max(2, start);
        const b = Math.min(end, start + lane.dash);
        if (b <= a) continue;
        const i0 = indexAt(a);
        const i1 = Math.min(samples.length - 1, Math.max(i0 + 1, indexAt(b)));
        const mid = samples[(i0 + i1) >> 1];
        if (mid.w < lane.minWidth) continue;
        ctx.lineWidth = Math.max(0.9, 1.9 * mid.scale);
        ctx.beginPath();
        for (let i = i0; i <= i1; i += 1) {
          const p = samples[i];
          const offset = lane.across * Math.max(0, p.w / 2 - bankWidth(p.w) - 1.2);
          ctx.lineTo(p.x + p.nx * offset, p.y + p.ny * offset);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function draw() {
    // Every bank first, then every body, so the side stream and the pool join the
    // main stream without a bank line across the water.
    for (const layer of ['bank', 'body']) {
      ctx.fillStyle = fill(layer);
      for (const piece of streams) {
        ctx.save();
        if (piece.clip) ctx.clip(hill);
        ctx.fill(piece[layer]);
        ctx.restore();
      }
      ctx.fill(layer === 'bank' ? ellipse(POOL.cx, POOL.cy, POOL.rx, POOL.ry) : poolBody);
    }
    // The fall's sheet over the pool, then white water where it lands.
    ctx.fillStyle = fill('bank');
    ctx.fill(fallShape);
    ctx.fillStyle = fill('fall');
    ctx.fill(polygon(fallOutline(1.4, 1.2)));
    ctx.fillStyle = fill('foam');
    for (const [dx, dy, rx, ry] of [[0, 1.5, 23, 5], [-30, 4.5, 7, 1.9], [31, 5, 8, 1.9], [-12, 8, 6, 1.4]]) {
      ctx.fill(ellipse(IMPACT[0] + dx, IMPACT[1] + dy, rx, ry));
    }
    ctx.fillStyle = fill('bank');
    ctx.fill(polygon(LAKE_SHORE));
    ctx.fillStyle = fill('body');
    ctx.fill(lakeBody);
    for (const piece of streams) dashes(piece);
    // Streaks down the sheet.
    ctx.strokeStyle = fill('foam');
    ctx.lineWidth = 1.7;
    FALL_COLUMNS.forEach((f, column) => {
      const dash = 18 + column * 4;
      ctx.beginPath();
      for (let y = FALL.top + ((column * 23 + time * 22) % 62) - 62; y < FALL.bottom; y += 62) {
        const a = Math.max(FALL.top + 3, y);
        const b = Math.min(FALL.bottom - 11, y + dash);
        if (b <= a) continue;
        ctx.moveTo(fallEdge(a, -1) + (fallEdge(a, 1) - fallEdge(a, -1)) * f, a);
        ctx.lineTo(fallEdge(b, -1) + (fallEdge(b, 1) - fallEdge(b, -1)) * f, b);
      }
      ctx.stroke();
    });
    // Rings: on the pool, off the sheet; on the lake, two out of step.
    ctx.lineWidth = 1.3;
    const ring = (clip, x, y, phase, rx, ry, strength) => {
      ctx.save();
      ctx.clip(clip, 'evenodd');
      ctx.strokeStyle = cssColor(colors.ring, strength * (1 - phase) * Math.min(1, phase * 6));
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    };
    const poolRings = new Path2D();
    poolRings.addPath(poolBody);
    poolRings.addPath(fallShape);
    for (let i = 0; i < 2; i += 1) {
      const phase = (time / 4.2 + i / 2) % 1;
      ring(poolRings, IMPACT[0], IMPACT[1] + 1, phase, 20 + phase * 30, 5 + phase * 6.5, 0.75);
    }
    LAKE_RINGS.forEach(([x, y], i) => {
      const phase = (time / 5.6 + i * 0.45) % 1;
      ring(lakeBody, x, y, phase, 4 + phase * 36, 1.2 + phase * 8, 0.7);
    });
  }

  return {
    kind: 'still',
    prepare: () => true,
    resize(width, height, dpr) {
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      const { k, ox, oy } = fit(width, height);
      const [sx, sy] = [canvas.width / width, canvas.height / height];
      ctx.setTransform(k * sx, 0, 0, k * sy, ox * sx, oy * sy);
      draw();
    },
    draw() {},
  };
}

// ——— Running it ———
/**
 * Start the water on `canvas`, which fills the same box as the map's SVG layers.
 * `covered()` says when something opaque lies over the whole map. Returns
 * `update()`, to call when that changes, and `stop()`.
 */
export function startWater(canvas, { covered = () => false } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let colors;
  let renderer;
  let frame = null;
  let last = null;
  let clock = STILL_TIME;
  let onScreen = false;
  let size = null;
  let observers = [];

  const still = () => reduce.matches || renderer.kind === 'still';
  const animating = () => !still() && onScreen && !document.hidden && !covered();
  const schedule = () => { if (frame === null) frame = requestAnimationFrame(tick); };

  function resize(width, height) {
    if (width < 1 || height < 1) return;
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    if (size && size.width === width && size.height === height && size.dpr === dpr) return;
    size = { width, height, dpr };
    renderer.resize(width, height, dpr);
    if (!paint()) schedule();
  }
  // Draw a frame if the renderer is ready; false while its shaders still compile.
  function paint() {
    if (!size) return false;
    try {
      if (!renderer.prepare()) return false;
    } catch {
      fallBack();
      return false;
    }
    renderer.draw(clock);
    canvas.dataset.ready = 'true';
    return true;
  }
  function tick(now) {
    frame = null;
    const moving = animating();
    if (moving && last !== null) clock = (clock + Math.min(now - last, 100) / 1000) % 3600;
    last = moving ? now : null;
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    if (size && dpr !== size.dpr) resize(size.width, size.height);
    const painted = paint();
    // Keep going while animating, or until the shaders are ready for a still frame.
    if (moving || (size && !painted)) schedule();
  }
  function update() {
    if (animating()) {
      schedule();
      return;
    }
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    last = null;
    if (still()) {
      clock = STILL_TIME;
      if (!paint()) schedule();
    }
  }

  function watch() {
    const resizer = new ResizeObserver(entries => {
      const { width, height } = entries[entries.length - 1].contentRect;
      resize(width, height);
    });
    resizer.observe(canvas);
    const visibility = new IntersectionObserver(entries => {
      onScreen = entries[entries.length - 1].isIntersecting;
      update();
    });
    visibility.observe(canvas);
    observers = [resizer, visibility];
  }
  function unwatch() {
    observers.forEach(observer => observer.disconnect());
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    last = null;
  }

  // Without WebGL, or once its context is lost, a fresh canvas shows the still drawing.
  function fallBack() {
    unwatch();
    canvas.removeEventListener('webglcontextlost', lost);
    const fresh = document.createElement('canvas');
    fresh.className = canvas.className;
    fresh.setAttribute('aria-hidden', 'true');
    fresh.dataset.ready = 'false';
    canvas.replaceWith(fresh);
    canvas = fresh;
    renderer = stillWater(canvas, colors);
    size = null;
    watch();
  }
  const lost = () => fallBack();

  try {
    colors = waterColors(canvas);
  } catch {
    return { update() {}, stop() {} };
  }
  try {
    renderer = webglWater(canvas, colors);
    canvas.addEventListener('webglcontextlost', lost);
    watch();
  } catch {
    fallBack();
  }
  document.addEventListener('visibilitychange', update);
  reduce.addEventListener('change', update);

  return {
    update,
    stop() {
      unwatch();
      canvas.removeEventListener('webglcontextlost', lost);
      document.removeEventListener('visibilitychange', update);
      reduce.removeEventListener('change', update);
    },
  };
}
