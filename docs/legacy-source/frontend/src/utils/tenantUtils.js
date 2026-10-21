const TENANT_BOOTSTRAP_KEY = "lms_tenant_bootstrap";

function normalizeHostOnly(host) {
  if (!host || typeof host !== "string") return null;
  let h = host.trim();
  if (!h) return null;
  h = h.replace(/^https?:\/\//i, "");
  const slash = h.indexOf("/");
  if (slash > 0) h = h.slice(0, slash);
  // Handle IPv6 literal forms (best-effort):
  // - [::1]:8080 -> ::1
  // - ::1 (as returned by browser location.hostname) should remain ::1
  if (h.startsWith("[")) {
    const end = h.indexOf("]");
    if (end > 1) h = h.slice(1, end);
  } else {
    const firstColon = h.indexOf(":");
    // If it's an IPv6 literal (contains ':' but isn't a host:port), don't truncate it.
    const looksLikeIpv6 = firstColon >= 0 && !h.includes(".");
    if (!looksLikeIpv6 && firstColon > 0) h = h.slice(0, firstColon);
  }
  if (h.toLowerCase().startsWith("www.")) h = h.slice(4);
  return h;
}

function isPrivateIpv4Host(host) {
  const text = normalizeHostOnly(host);
  if (!text) return false;
  const parts = text.split(".");
  if (parts.length !== 4) return false;
  const nums = parts.map((part) => Number(part));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = nums;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export function isLocalDevelopmentHost(host) {
  const text = normalizeHostOnly(host);
  if (!text) return false;
  if (
    text === "localhost" ||
    text === "127.0.0.1" ||
    text === "0.0.0.0" ||
    text === "::1" ||
    text.endsWith(".localhost")
  ) {
    return true;
  }
  const isDev = typeof process !== "undefined" && process.env?.NODE_ENV === "development";
  if (!isDev) return false;
  return text === "10.0.2.2" || isPrivateIpv4Host(text);
}

function getCurrentHost() {
  if (typeof window === "undefined") return null;
  return normalizeHostOnly(window.location.hostname);
}

export const getTenantBootstrapFromStorage = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TENANT_BOOTSTRAP_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed) return null;
    // Invalidate stale bootstrap if user navigated to a different host in the same browser session.
    const savedHost = normalizeHostOnly(parsed?._host);
    const currentHost = getCurrentHost();
    if (savedHost && currentHost && savedHost !== currentHost) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveTenantBootstrapToStorage = (bootstrap) => {
  if (typeof window === "undefined") return;
  try {
    const currentHost = getCurrentHost();
    const payload = { ...(bootstrap || {}) };
    if (currentHost) payload._host = currentHost;
    payload._savedAt = Date.now();
    localStorage.setItem(TENANT_BOOTSTRAP_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota issues
  }
};

export const clearTenantBootstrapFromStorage = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TENANT_BOOTSTRAP_KEY);
  } catch {
    // ignore
  }
};

export const getTenantCollegeId = () => {
  const b = getTenantBootstrapFromStorage();
  const id = b?.collegeId;
  return typeof id === "number" ? id : null;
};

export const getFortyTwoLearnHost = () => {
  const b = getTenantBootstrapFromStorage();
  return b?.fortyTwoLearnHost || b?.fortyTwoLearn || null;
};

export const isGlobalBootstrap = () => {
  const b = getTenantBootstrapFromStorage();
  return b?.mode === "GLOBAL";
};

export const getGlobalHost = () => {
  const b = getTenantBootstrapFromStorage();
  return b?.globalHost || null;
};

export { normalizeHostOnly };
