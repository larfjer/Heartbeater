/**
 * Time utility helpers
 */
export function toIso8601(date = new Date()) {
  return new Date(date).toISOString();
}

export function nowIso() {
  return toIso8601(new Date());
}

export function formatLocal(date = new Date()) {
  return new Date(date).toString();
}

export function parseIso(iso) {
  return iso ? new Date(iso) : null;
}

export default { toIso8601, nowIso, formatLocal, parseIso };
