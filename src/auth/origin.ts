export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const rawHost =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host");

  if (!origin || !rawHost) return false;

  const host = rawHost.split(",")[0]?.trim();
  if (!host) return false;

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol =
    forwardedProto?.split(",")[0]?.trim() ||
    new URL(request.url).protocol.replace(":", "");

  try {
    return (
      new URL(origin).origin ===
      new URL(`${protocol}://${host}`).origin
    );
  } catch {
    return false;
  }
}
