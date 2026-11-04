/** Read a browser form using a strict byte budget BEFORE invoking multipart parsing.
 * Content-Length is untrusted (and frequently absent on chunked requests).
 * Byte-count the actual stream so a rejected upload cannot consume unbounded
 * process memory. This helper only parses transport; callers still authorize
 * the actor and each owning resource independently.
 */
export class BoundedFormDataError extends Error {
  constructor(readonly code: "INVALID_FORM" | "BODY_TOO_LARGE") {
    super(code);
    this.name = "BoundedFormDataError";
  }
}

export async function readBoundedFormData(
  request: Request,
  maxBytes: number,
): Promise<FormData> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 32 * 1024 * 1024) {
    throw new Error("INVALID_FORM_BODY_LIMIT");
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.length > 512 || /[\r\n]/.test(contentType)) {
    throw new BoundedFormDataError("INVALID_FORM");
  }
  const multipart = /^multipart\/form-data\s*;/i.test(contentType);
  const urlencoded = /^application\/x-www-form-urlencoded\s*(?:;\s*charset\s*=\s*"?utf-8"?\s*)?$/i.test(contentType);
  if (!multipart && !urlencoded) {
    throw new BoundedFormDataError("INVALID_FORM");
  }
  if (multipart && !/(?:^|;)\s*boundary=(?:"[^"\r\n]{1,200}"|[^;\s]{1,200})(?:\s*;|$)/i.test(contentType)) {
    throw new BoundedFormDataError("INVALID_FORM");
  }
  const length = request.headers.get("content-length");
  if (length !== null) {
    if (!/^\d+$/.test(length) || !Number.isSafeInteger(Number(length))) {
      throw new BoundedFormDataError("INVALID_FORM");
    }
    if (Number(length) > maxBytes) {
      throw new BoundedFormDataError("BODY_TOO_LARGE");
    }
  }
  if (!request.body) throw new BoundedFormDataError("INVALID_FORM");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new BoundedFormDataError("BODY_TOO_LARGE");
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof BoundedFormDataError) throw error;
    await reader.cancel().catch(() => undefined);
    throw new BoundedFormDataError("INVALID_FORM");
  } finally {
    reader.releaseLock();
  }
  if (!size) throw new BoundedFormDataError("INVALID_FORM");
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return await new Response(bytes, { headers: { "content-type": contentType } }).formData();
  } catch {
    throw new BoundedFormDataError("INVALID_FORM");
  }
}
