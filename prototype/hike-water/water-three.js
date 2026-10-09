// Versions B and C: the hike's water as one orthographic Three.js layer between
// the flat background SVG and the trail, trees and labels. Still flat-coloured:
// B moves soft bands along the streams, a falling sheet with foam, gentle rings;
// C adds light: small moving glints, a shimmer on the fall, a darker middle.
//
// One renderer, five meshes (main stream, side stream, fall, pool, lake), one
// draw call each, no textures. Each piece writes how far a pixel is from its own
// bank as depth, so where pieces overlap (the side stream entering the main one,
// the pool) the piece whose middle it is wins: the banks join without a seam.
import {
  WebGLRenderer, Scene, OrthographicCamera, Mesh, BufferGeometry, BufferAttribute, ShaderMaterial, DoubleSide,
} from 'three';
import { MAIN, SIDE, POOL, LAKE, FALL, IMPACT, LAKE_RINGS, SADDLE, visibleBounds } from './geometry.js';
import { waterColors } from './water-colors.js';
import { FLOW_SPEED } from './water-flat.js';

const FRINGE = 1.6; // map units of soft outer edge
const RING_SEGMENTS = 72;

const COMMON = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBank;
  uniform vec3 uBody;
  uniform vec3 uDeep;
  uniform vec3 uBand;
  uniform vec3 uFoam;
  uniform vec3 uRing;
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  // Soft outer edge: 0 outside, 1 inside, over about one device pixel.
  float inside(float edge) {
    float aa = max(fwidth(edge), 1e-3);
    return smoothstep(-aa, aa * 0.5, edge);
  }
#ifdef LIGHT
  // A glint: a small soft fleck in a sparse grid of cells that drift and fade in and out.
  float glint(vec2 cellSpace, float seed, float density) {
    vec2 cell = floor(cellSpace);
    vec2 f = fract(cellSpace) - 0.5;
    float r = hash(cell + seed);
    float on = step(1.0 - density, r);
    float life = 0.5 + 0.5 * sin(uTime * (1.1 + r) + r * 60.0);
    vec2 jitter = vec2(hash(cell + seed + 3.1), hash(cell + seed + 7.7)) - 0.5;
    float shape = 1.0 - smoothstep(0.0, 1.0, length((f - jitter * 0.4) / vec2(0.34, 0.2)));
    return on * shape * life * life;
  }
#endif
`;

const STREAM_VERTEX = /* glsl */ `
  attribute vec4 aData;
  varying vec4 vData;
  varying vec2 vPos;
  void main() {
    vData = aData;
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const STREAM_FRAGMENT = /* glsl */ `
  ${COMMON}
  uniform float uClip;
  uniform float uFlowSpeed;
  uniform vec2 uSaddleA;
  uniform vec2 uSaddleB;
  uniform vec2 uSaddleC;
  varying vec4 vData; // across (-1..1), distance in from the bank, flow distance, half width
  varying vec2 vPos;
  float crest(float x) {
    if (x <= uSaddleA.x || x >= uSaddleC.x) return -1e4;
    if (x <= uSaddleB.x) return mix(uSaddleA.y, uSaddleB.y, (x - uSaddleA.x) / (uSaddleB.x - uSaddleA.x));
    return mix(uSaddleB.y, uSaddleC.y, (x - uSaddleB.x) / (uSaddleC.x - uSaddleB.x));
  }
  void main() {
    float across = vData.x;
    float edge = vData.y;
    float flow = vData.z;
    float halfWidth = vData.w;
    float alpha = inside(edge);
    // Behind the far ridge: hidden above its crest.
    if (uClip > 0.5) alpha *= inside(vPos.y - crest(vPos.x));
    if (alpha < 0.003) discard;
    float bank = 0.6 + 0.24 * halfWidth;
    float bankMix = 1.0 - smoothstep(bank * 0.55, bank * 1.3, edge);
    float centre = clamp(edge / max(halfWidth, 1e-3), 0.0, 1.0);
    // Soft bands along the ribbon, drifting downstream; two layers at different speeds so they change as they go.
    float drift = uTime * uFlowSpeed;
    float n = noise(vec2((flow - drift) * 0.026, across * 2.3)) * 0.62
            + noise(vec2((flow - drift * 1.35) * 0.041 + 3.7, across * 3.3 + 1.3)) * 0.38;
    float band = smoothstep(0.44, 0.74, n);
    vec3 body = uBody;
    float bandMix = 0.62;
#ifdef LIGHT
    // A hint of depth: the middle a touch darker than the edges.
    body = mix(uBody, uDeep, smoothstep(0.1, 0.95, centre));
    bandMix = 0.48;
#endif
    vec3 color = mix(body, uBand, band * bandMix);
#ifdef LIGHT
    // Light on the water: small flecks riding the flow.
    float g = glint(vec2((flow - drift * 1.1) / 15.0, across * 2.6 + 2.6), 11.0, 0.24);
    color = mix(color, uFoam, g * (1.0 - bankMix));
#endif
    color = mix(color, uBank, bankMix);
    gl_FragColor = vec4(color, alpha);
  }
`;

const POND_VERTEX = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const POND_FRAGMENT = /* glsl */ `
  ${COMMON}
  uniform vec2 uCenter;
  uniform vec2 uRadius;
  uniform vec4 uSources;   // two ring centres
  uniform vec2 uRingSize;  // a ring's largest radii
  uniform float uRingCycle;
  uniform float uFoamOn;
  uniform float uBankWidth;
  varying vec2 vPos;
  // Distance (map units) to an ellipse's rim, close to the rim; positive inside.
  float rimDistance(vec2 d, vec2 radius) {
    float r = length(d / radius);
    float g = length(d / (radius * radius));
    return r < 1e-3 ? min(radius.x, radius.y) : (1.0 - r) * r / max(g, 1e-5);
  }
  float ring(vec2 source, float phase) {
    vec2 d = vPos - source;
    vec2 radius = uRingSize * mix(0.12, 1.0, phase);
    float line = abs(rimDistance(d, radius));
    return (1.0 - smoothstep(0.35, 1.1, line)) * (1.0 - phase) * smoothstep(0.0, 0.12, phase);
  }
  void main() {
    float edge = rimDistance(vPos - uCenter, uRadius);
    float alpha = inside(edge);
    if (alpha < 0.003) discard;
    float bank = uBankWidth;
    float bankMix = 1.0 - smoothstep(bank * 0.55, bank * 1.3, edge);
    float centre = clamp(edge / uRadius.y, 0.0, 1.0);
    vec3 color = uBody;
#ifdef LIGHT
    color = mix(uBody, uDeep, smoothstep(0.1, 1.0, centre) * 0.8);
#endif
    float rings = 0.0;
    for (int i = 0; i < 2; i++) {
      float phase = fract(uTime / uRingCycle + float(i) * 0.5);
      vec2 source = i == 0 ? uSources.xy : uSources.zw;
      rings += ring(source, phase);
    }
    color = mix(color, uRing, clamp(rings, 0.0, 1.0) * 0.6);
    if (uFoamOn > 0.5) {
      // Foam where the fall lands: a white patch with a slowly churning edge.
      vec2 f = (vPos - uCenter - vec2(0.0, -2.0)) / vec2(21.0, 5.2);
      float churn = noise(vec2(atan(f.y, f.x) * 2.2 + uTime * 0.7, uTime * 0.5)) - 0.5;
      float foam = 1.0 - smoothstep(0.78, 1.0, length(f) + churn * 0.42);
      float flecks = step(0.72, noise(vPos * vec2(0.32, 0.9) + vec2(uTime * 0.6, 0.0))) * (1.0 - smoothstep(1.0, 1.9, length(f)));
      color = mix(color, uFoam, max(foam, flecks * 0.8));
    }
#ifdef LIGHT
    float g = glint((vPos - uCenter) / vec2(15.0, 4.2) + vec2(uTime * 0.12, 0.0), 23.0, 0.16);
    color = mix(color, uFoam, g * (1.0 - bankMix));
#endif
    color = mix(color, uBank, bankMix);
    gl_FragColor = vec4(color, alpha);
  }
`;

const FALL_VERTEX = /* glsl */ `
  attribute vec3 aFall; // across (0..1 inside), down (0..1), width
  varying vec3 vFall;
  varying vec2 vPos;
  void main() {
    vFall = aFall;
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FALL_FRAGMENT = /* glsl */ `
  ${COMMON}
  uniform vec3 uSheet;
  varying vec3 vFall;
  varying vec2 vPos;
  void main() {
    float across = vFall.x;
    float width = vFall.z;
    float edge = min(across, 1.0 - across) * width;
    float alpha = inside(edge);
    if (alpha < 0.003) discard;
    float bankMix = 1.0 - smoothstep(0.7, 2.0, edge);
    // The falling sheet: long soft streaks, stretched down the fall, sliding downwards.
    float n = noise(vec2(across * 7.0, vPos.y * 0.024 - uTime * 0.9)) * 0.62
            + noise(vec2(across * 12.0 + 4.0, vPos.y * 0.041 - uTime * 1.25)) * 0.38;
    float streak = smoothstep(0.5, 0.72, n);
    vec3 color = mix(uSheet, uFoam, streak * 0.9);
    // The lip, where the water turns over the rock.
    color = mix(color, uFoam, (1.0 - smoothstep(0.0, 0.05, vFall.y)) * 0.6);
#ifdef LIGHT
    // A slight lighter shimmer travelling down the sheet.
    float shimmer = 0.5 + 0.5 * sin((vPos.y / 36.0 - uTime * 0.5) * 6.2832 + across * 2.0);
    color = mix(color, uFoam, shimmer * shimmer * 0.22);
#endif
    color = mix(color, uBank, bankMix);
    gl_FragColor = vec4(color, alpha);
  }
`;

// A stream ribbon: three vertices across (bank, middle, bank) at every sample.
function streamGeometry(stream) {
  const { samples } = stream;
  const n = samples.length;
  const position = new Float32Array(n * 3 * 3);
  const data = new Float32Array(n * 3 * 4);
  samples.forEach((p, i) => {
    const half = p.w / 2;
    [-1, 0, 1].forEach((side, j) => {
      const reach = side ? half + FRINGE : 0;
      const edge = side ? -FRINGE : half;
      const v = i * 3 + j;
      position.set([p.x + p.nx * reach * side, p.y + p.ny * reach * side, edge], v * 3);
      data.set([side * (1 + FRINGE / half), edge, p.flow, half], v * 4);
    });
  });
  const index = [];
  for (let i = 0; i < n - 1; i += 1) {
    for (let j = 0; j < 2; j += 1) {
      const a = i * 3 + j;
      const b = a + 1;
      const c = a + 3;
      const d = a + 4;
      index.push(a, c, b, b, c, d);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setAttribute('aData', new BufferAttribute(data, 4));
  geometry.setIndex(index);
  return geometry;
}

// An ellipse as a fan; depth is a cone, highest in the middle.
function pondGeometry({ cx, cy, rx, ry }) {
  const position = new Float32Array((RING_SEGMENTS + 1) * 3);
  position.set([cx, cy, ry], 0);
  for (let i = 0; i < RING_SEGMENTS; i += 1) {
    const angle = (i / RING_SEGMENTS) * Math.PI * 2;
    position.set([cx + Math.cos(angle) * (rx + FRINGE * 1.5), cy + Math.sin(angle) * (ry + FRINGE * 1.5), -FRINGE], (i + 1) * 3);
  }
  const index = [];
  for (let i = 0; i < RING_SEGMENTS; i += 1) index.push(0, i + 1, ((i + 1) % RING_SEGMENTS) + 1);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setIndex(index);
  return geometry;
}

// The fall's sheet: a strip of rows down the rock, widening a little at the foot.
function fallGeometry() {
  const rows = 10;
  const position = new Float32Array((rows + 1) * 2 * 3);
  const fall = new Float32Array((rows + 1) * 2 * 3);
  for (let r = 0; r <= rows; r += 1) {
    const f = r / rows;
    const y = FALL.top + (FALL.bottom - FALL.top) * f;
    const left = FALL.topLeft + (FALL.footLeft - FALL.topLeft) * f;
    const right = FALL.topRight + (FALL.footRight - FALL.topRight) * f;
    const width = right - left;
    position.set([left - FRINGE, y, 0, right + FRINGE, y, 0], r * 6);
    fall.set([-FRINGE / width, f, width, 1 + FRINGE / width, f, width], r * 6);
  }
  const index = [];
  for (let r = 0; r < rows; r += 1) {
    const a = r * 2;
    index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setAttribute('aFall', new BufferAttribute(fall, 3));
  geometry.setIndex(index);
  return geometry;
}

export function createThreeWater(canvas, { light = false, onLost } = {}) {
  if (!canvas.getContext('webgl2')) throw new Error('WebGL 2 is not available');
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true, stencil: false, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  const colors = waterColors();
  const shared = {
    uTime: { value: 0 },
    uBank: { value: colors.bank },
    uBody: { value: colors.body },
    uDeep: { value: colors.deep },
    uBand: { value: colors.light },
    uFoam: { value: colors.foam },
    uRing: { value: colors.ring },
  };
  const material = (vertexShader, fragmentShader, uniforms = {}) => new ShaderMaterial({
    vertexShader, fragmentShader, uniforms: { ...shared, ...uniforms }, defines: light ? { LIGHT: '' } : {},
    transparent: true, depthTest: true, depthWrite: true, side: DoubleSide,
  });
  const scene = new Scene();
  const add = (geometry, mat, order) => {
    const mesh = new Mesh(geometry, mat);
    mesh.renderOrder = order;
    mesh.frustumCulled = false;
    scene.add(mesh);
    return mesh;
  };
  const streamUniforms = clip => ({
    uClip: { value: clip ? 1 : 0 },
    uFlowSpeed: { value: FLOW_SPEED },
    uSaddleA: { value: SADDLE[0] },
    uSaddleB: { value: SADDLE[1] },
    uSaddleC: { value: SADDLE[2] },
  });
  const pondUniforms = (pond, sources, ringSize, cycle, foam, bank) => ({
    uBankWidth: { value: bank },
    uCenter: { value: [pond.cx, pond.cy] },
    uRadius: { value: [pond.rx, pond.ry] },
    uSources: { value: sources.flat() },
    uRingSize: { value: ringSize },
    uRingCycle: { value: cycle },
    uFoamOn: { value: foam ? 1 : 0 },
  });
  add(pondGeometry(LAKE), material(POND_VERTEX, POND_FRAGMENT, pondUniforms(LAKE, LAKE_RINGS, [40, 9.5], 5.6, false, 4.2)), 0);
  add(fallGeometry(), material(FALL_VERTEX, FALL_FRAGMENT, { uSheet: { value: colors.fall } }), 1);
  add(pondGeometry(POOL), material(POND_VERTEX, POND_FRAGMENT, pondUniforms(POOL, [[IMPACT[0], IMPACT[1] + 1], [IMPACT[0], IMPACT[1] + 1]], [POOL.rx - 4, POOL.ry - 2], 4.2, true, 3)), 2);
  add(streamGeometry(SIDE), material(STREAM_VERTEX, STREAM_FRAGMENT, streamUniforms(false)), 3);
  add(streamGeometry(MAIN), material(STREAM_VERTEX, STREAM_FRAGMENT, streamUniforms(true)), 4);

  // Map units in, y down: the camera's top is the smaller y.
  const camera = new OrthographicCamera(0, 1200, 0, 800, 0.1, 400);
  camera.position.set(0, 0, 200);

  const lost = event => {
    event.preventDefault();
    onLost?.();
  };
  canvas.addEventListener('webglcontextlost', lost);

  return {
    kind: 'three',
    // Shaders compile in the background where the browser supports it, so the first frame doesn't stall.
    ready: renderer.compileAsync(scene, camera),
    resize(width, height, dpr) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      const { left, right, top, bottom } = visibleBounds(width, height);
      Object.assign(camera, { left, right, top, bottom });
      camera.updateProjectionMatrix();
    },
    draw(time) {
      shared.uTime.value = time;
      renderer.render(scene, camera);
    },
    info: () => ({
      kind: 'three',
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      programs: renderer.info.programs?.length,
      pixelRatio: renderer.getPixelRatio(),
    }),
    dispose() {
      canvas.removeEventListener('webglcontextlost', lost);
      scene.traverse(node => { node.geometry?.dispose(); node.material?.dispose(); });
      renderer.dispose();
    },
  };
}
