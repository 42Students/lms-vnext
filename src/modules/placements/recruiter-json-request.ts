/** Bounds JSON bodies before parsing so chunked clients cannot bypass the
 * Content-Length check. The caller still validates the resulting value using
 * its route schema; this helper never treats parsed JSON as trusted input.
 */
export class RecruiterJsonBodyError extends Error {
  constructor(readonly kind: "INVALID_JSON" | "TOO_LARGE") {
    super(kind);
    this.name = "RecruiterJsonBodyError";
  }
}

export async function readRecruiterJsonBody(
  request: Request, maxBytes = 128 * 1024,
): Promise<unknown> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1)
    throw new RecruiterJsonBodyError("INVALID_JSON");
  const declared = request.headers.get("content-length");
  if (declared !== null && /^\d+$/.test(declared) && Number(declared) > maxBytes)
    throw new RecruiterJsonBodyError("TOO_LARGE");

  const body = request.body;
  if (!body) throw new RecruiterJsonBodyError("INVALID_JSON");
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new RecruiterJsonBodyError("TOO_LARGE");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    if (error instanceof RecruiterJsonBodyError) throw error;
    throw new RecruiterJsonBodyError("INVALID_JSON");
  } finally {
    reader.releaseLock();
  }

  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new RecruiterJsonBodyError("INVALID_JSON");
  }
}
