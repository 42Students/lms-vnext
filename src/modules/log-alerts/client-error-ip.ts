import { clientIp } from "@/auth/ip-rate-limit";

/**
 * Browser diagnostics are optional telemetry, not an authentication source.
 * The Google load balancer appends the final two X-Forwarded-For hops;
 * anything to their left is caller-controlled. Never prefer X-Real-IP or
 * the first forwarded hop, even when a deployment opts into trusted ingress.
 *
 * Fail open for telemetry only: an unverifiable IP becomes null so the
 * authenticated per-user quota still applies without grouping an entire NAT
 * behind a spoofable "unknown" address.
 */
export function trustedClientErrorIp(
  request: Request,
  trustedIngress: boolean,
): string | null {
  if (!trustedIngress) return null;
  const forwarded = request.headers.get("x-forwarded-for");
  // An authenticated production ingress must append both hops. A lone value
  // is ambiguous and may have come directly from an untrusted HTTP caller.
  if (!forwarded || !forwarded.includes(",")) return null;
  const selected = clientIp(request);
  return selected === "unknown" ? null : selected;
}
