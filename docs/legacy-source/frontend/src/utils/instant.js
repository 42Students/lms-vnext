/*
 * The logs API returns Instants as epoch SECONDS (e.g. 1790608529.29), while browser code, and
 * new Date(x), expects milliseconds or an ISO string. Reading seconds as milliseconds lands in
 * January 1970, which silently breaks every "since" comparison. Normalize once, where data arrives.
 */
const SECONDS_CEILING = 1e11; // ~year 5138 in seconds, ~March 1973 in milliseconds

export function instantMs(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return value < SECONDS_CEILING ? Math.round(value * 1000) : value;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function instantIso(value) {
  const ms = instantMs(value);
  return ms == null ? null : new Date(ms).toISOString();
}

function withIso(object, keys) {
  if (!object || typeof object !== "object") return object;
  const out = { ...object };
  keys.forEach((key) => {
    if (key in out) out[key] = instantIso(out[key]);
  });
  return out;
}

export const normalizeDeploy = (deploy) => withIso(deploy, ["at"]);
export const normalizeKnownError = (row) => withIso(row, ["firstSeenAt", "lastSeenAt", "regressedAt", "fixedAt"]);

export function normalizeDigest(digest) {
  if (!digest || typeof digest !== "object") return digest;
  const item = (i) => withIso(i, ["firstSeenAt", "lastSeenAt"]);
  return {
    ...withIso(digest, ["since", "until"]),
    newErrors: (digest.newErrors || []).map(item),
    regressions: (digest.regressions || []).map(item),
    fixed: (digest.fixed || []).map(item),
    deploys: (digest.deploys || []).map(normalizeDeploy),
  };
}
