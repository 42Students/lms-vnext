/** Bulk endpoints accept at most 200 signed selections, not unbounded JSON uploads. */
export const TPO_BULK_BODY_MAX_BYTES = 64 * 1024;
export class TpoBulkBodyError extends Error {
  constructor(readonly status: 400 | 413 | 415) {
    super(status === 413 ? "REQUEST_TOO_LARGE" : status === 415 ? "UNSUPPORTED_MEDIA_TYPE" : "INVALID_JSON");
    this.name = "TpoBulkBodyError";
  }
}
export async function readTpoBulkRequestBody(request: Request): Promise<Record<string, unknown>> {
  const contentType=request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if(contentType!=="application/json")throw new TpoBulkBodyError(415);
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) ||
    Number(declared) > TPO_BULK_BODY_MAX_BYTES)) throw new TpoBulkBodyError(413);
  // Do not buffer an untrusted body first: chunked uploads may omit Content-Length.
  // Stop reading as soon as the actual byte limit is exceeded.
  const reader = request.body?.getReader();
  if (!reader) throw new TpoBulkBodyError(400);
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let text = "";
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > TPO_BULK_BODY_MAX_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new TpoBulkBodyError(413);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch (error) {
    if (error instanceof TpoBulkBodyError) throw error;
    throw new TpoBulkBodyError(400);
  } finally {
    reader.releaseLock();
  }
  try {
    const body: unknown = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Expected JSON object");
    return body as Record<string, unknown>;
  } catch {
    throw new TpoBulkBodyError(400);
  }
}
