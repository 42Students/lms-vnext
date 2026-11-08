/**
 * SSRF guard for server-side requests to providers (SEC-15-010, SEC-15-011, SEC-23-012).
 *
 * Every outbound request must be HTTPS, carry no credentials in the URL, and name a public host. Loopback, private,
 * link-local (including the cloud metadata address) and unspecified addresses, and internal-looking host names, are
 * refused. This stops a bad configuration value or a URL taken from data from pointing the server at the cluster
 * network or the metadata service. It checks the URL text only; the NetworkPolicy on the pod (public HTTPS only,
 * deploy/k8s/dev/lms-vnext-egress-policy.yaml) is the second wall against DNS names that resolve to private addresses.
 */

export class OutboundUrlRefusedError extends Error {
  constructor(readonly reason: string) {
    super("OUTBOUND_URL_REFUSED");
    this.name = "OutboundUrlRefusedError";
  }
}

function ipv4Parts(host: string): number[] | null {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  return parts.every((n) => n <= 255) ? parts : null;
}

function privateIpv4(p: number[]): boolean {
  const [a, b] = p as [number, number, number, number];
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

function privateIpv6(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (!h.includes(":")) return false;
  if (h === "::" || h === "::1") return true;
  if (h.startsWith("fe8") || h.startsWith("fe9") || h.startsWith("fea") || h.startsWith("feb")) return true; // fe80::/10
  if (h.startsWith("fc") || h.startsWith("fd")) return true; // fc00::/7
  const dotted = h.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    const p = ipv4Parts(dotted[1]!);
    return !p || privateIpv4(p);
  }
  // The URL parser rewrites ::ffff:a.b.c.d as ::ffff:hhhh:hhhh.
  const hex = h.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const hi = parseInt(hex[1]!, 16);
    const lo = parseInt(hex[2]!, 16);
    return privateIpv4([hi >> 8, hi & 255, lo >> 8, lo & 255]);
  }
  return false;
}

/** Throws OutboundUrlRefusedError unless the URL is an HTTPS URL to a public-looking host. Returns the parsed URL. */
export function assertSafeOutboundUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new OutboundUrlRefusedError("not a URL");
  }
  if (url.protocol !== "https:") throw new OutboundUrlRefusedError("not https");
  if (url.username || url.password) throw new OutboundUrlRefusedError("credentials in URL");
  const host = url.hostname.toLowerCase();
  if (!host) throw new OutboundUrlRefusedError("no host");
  const v4 = ipv4Parts(host);
  if (v4 && privateIpv4(v4)) throw new OutboundUrlRefusedError("private address");
  if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) throw new OutboundUrlRefusedError("numeric host form");
  if (privateIpv6(host)) throw new OutboundUrlRefusedError("private address");
  if (
    host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") ||
    host === "metadata.google.internal" || host.endsWith(".svc") || host.endsWith(".cluster.local") || !host.includes(".")
  ) {
    if (!host.includes(":")) throw new OutboundUrlRefusedError("internal host name");
  }
  return url;
}
