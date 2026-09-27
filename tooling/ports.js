// Every project-run server (site, prototype studies, previews, tests) stays
// within 4600–4699 on 127.0.0.1 and fails on a conflict instead of moving.
export const MIN_PORT = 4600;
export const MAX_PORT = 4699;

export const PORTS = Object.freeze({
  siteDev: 4600,
  sitePreview: 4601,
  prototypeDev: 4602,
  prototypePreview: 4603,
});

export function assertProjectPort(value, service) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new Error(`${service} port must be between ${MIN_PORT} and ${MAX_PORT}; received ${value}`);
  }
  return port;
}

export function assertLocalhost(value, service) {
  if (value !== '127.0.0.1') {
    throw new Error(`${service} host must remain 127.0.0.1; received ${value}`);
  }
  return value;
}
