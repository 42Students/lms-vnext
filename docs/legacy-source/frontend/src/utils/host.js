// Pure host helpers safe for the Next middleware/proxy (Edge runtime — no window/DOM).
//
// "Global" host = the apex marketing host (42lms.com / www) and local dev/preview.
// Everything else (college subdomains like dgi.42lms.com, external tenant domains
// like emedha.jntukelearn.in) is treated as a TENANT host and keeps login at "/".
//
// This is the single config point for which hosts show the marketing site. It mirrors
// the GLOBAL/TENANT decision the backend makes in PublicTenantController.

const GLOBAL_HOSTS = new Set(["42lms.com", "www.42lms.com"]);

export function normalizeHost(hostHeader) {
  if (!hostHeader || typeof hostHeader !== "string") return "";
  let h = hostHeader.trim().toLowerCase();
  h = h.replace(/^https?:\/\//, "");
  const slash = h.indexOf("/");
  if (slash >= 0) h = h.slice(0, slash);
  // strip port (IPv4/hostname; IPv6 literals aren't expected for this app's hosts)
  const colon = h.indexOf(":");
  if (colon >= 0) h = h.slice(0, colon);
  return h;
}

export function isLocalHost(hostHeader) {
  const h = normalizeHost(hostHeader);
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h === "::1" ||
    h.endsWith(".localhost")
  );
}

// True when the request is for the apex marketing host (or local dev/preview).
export function isGlobalHost(hostHeader) {
  const h = normalizeHost(hostHeader);
  if (!h) return false;
  if (isLocalHost(h)) return true;
  return GLOBAL_HOSTS.has(h);
}
