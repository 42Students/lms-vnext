import { readBoundedJsonBody } from "@/lib/bounded-json-body";

/**
 * Convert only the legacy token-in-path API shape into the modern body shape.
 * The canonical worker still handles host/scope, origin, OTP, rate limits,
 * expiration, revocation and authorization. Never redirect a code or join
 * request, and never accept an override of the path token from untrusted JSON.
 */
export async function legacyCollegeJoinRequest(
  request: Request, token: string,
): Promise<Request | null> {
  if (!/^[a-zA-Z0-9._~-]{12,512}$/.test(token)) return null;
  const decoded = await readBoundedJsonBody(request);
  if (decoded.kind !== "OK" || !decoded.value ||
      typeof decoded.value !== "object" || Array.isArray(decoded.value))
    return null;
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  headers.set("content-type", "application/json");
  return new Request(request.url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...(decoded.value as Record<string, unknown>),
      token,
    }),
  });
}
