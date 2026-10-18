/**
 * Faculty live class and attendance scheduling commands only carry bounded
 * metadata. Files belong to separately authorized upload APIs.
 */
export const FACULTY_AUTHORING_LIMIT_BYTES = 128 * 1024;

export class FacultyAuthoringBodyError extends Error {
  constructor(
    public readonly code:
      | "FACULTY_AUTHORING_BODY_TOO_LARGE"
      | "INVALID_FACULTY_AUTHORING_JSON"
      | "UNSUPPORTED_FACULTY_AUTHORING_CONTENT_TYPE",
    public readonly status: 400 | 413 | 415,
  ) {
    super(code);
    this.name = "FacultyAuthoringBodyError";
  }
}

export async function readFacultyAuthoringBody(request: Request): Promise<unknown> {
  const rawType = request.headers.get("content-type");
  const mediaType = rawType?.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== "application/json" &&
    !(mediaType?.startsWith("application/") && mediaType.endsWith("+json"))) {
    throw new FacultyAuthoringBodyError("UNSUPPORTED_FACULTY_AUTHORING_CONTENT_TYPE", 415);
  }

  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const parsed = Number(declared);
    if (!/^\d+$/.test(declared) || !Number.isSafeInteger(parsed)) {
      throw new FacultyAuthoringBodyError("INVALID_FACULTY_AUTHORING_JSON", 400);
    }
    if (parsed > FACULTY_AUTHORING_LIMIT_BYTES) {
      throw new FacultyAuthoringBodyError("FACULTY_AUTHORING_BODY_TOO_LARGE", 413);
    }
  }
  if (!request.body) throw new FacultyAuthoringBodyError("INVALID_FACULTY_AUTHORING_JSON", 400);

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let payload = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > FACULTY_AUTHORING_LIMIT_BYTES) {
        throw new FacultyAuthoringBodyError("FACULTY_AUTHORING_BODY_TOO_LARGE", 413);
      }
      payload += decoder.decode(value, { stream: true });
    }
    payload += decoder.decode();
  } catch (error) {
    if (error instanceof FacultyAuthoringBodyError) throw error;
    throw new FacultyAuthoringBodyError("INVALID_FACULTY_AUTHORING_JSON", 400);
  } finally {
    reader.releaseLock();
  }

  try {
    return JSON.parse(payload) as unknown;
  } catch {
    throw new FacultyAuthoringBodyError("INVALID_FACULTY_AUTHORING_JSON", 400);
  }
}
