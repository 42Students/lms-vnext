/**
 * A fresh opaque 8-character reference for customer support. Usage:
 *   const requestId = createRequestId();
 *   response.headers.set("x-request-id", requestId);
 *   logError("api.unhandled_error", error, { requestId });
 * Never put internal exception text into the response.
 */
export function createRequestId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function responseWithRequestId<T extends Response>(response: T, requestId = createRequestId()): T {
  response.headers.set("x-request-id", requestId);
  return response;
}

export function isRequestId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{8}$/i.test(value);
}
