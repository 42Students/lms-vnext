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
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > TPO_BULK_BODY_MAX_BYTES)
    throw new TpoBulkBodyError(413);
  try {
    const body: unknown = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Expected JSON object");
    return body as Record<string, unknown>;
  } catch {
    throw new TpoBulkBodyError(400);
  }
}
