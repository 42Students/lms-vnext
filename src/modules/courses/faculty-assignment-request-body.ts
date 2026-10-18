/**
 * Faculty assignment commands contain text metadata only. Attachments use
 * separately authorized file workflows; never buffer an unbounded HTTP body.
 */
export const FACULTY_ASSIGNMENT_COMMAND_LIMIT_BYTES = 128 * 1024;

export class FacultyAssignmentBodyError extends Error {
  constructor(
    public readonly code:
      | "ASSIGNMENT_BODY_TOO_LARGE"
      | "INVALID_ASSIGNMENT_JSON"
      | "UNSUPPORTED_ASSIGNMENT_CONTENT_TYPE",
    public readonly status: 400 | 413 | 415,
  ) {
    super(code);
    this.name = "FacultyAssignmentBodyError";
  }
}

export function facultyAssignmentAcceptsContentType(raw: string | null): boolean {
  if (!raw) return false;
  const mediaType = raw.split(";", 1)[0]?.trim().toLowerCase();
  return mediaType === "application/json" ||
    Boolean(mediaType?.startsWith("application/") && mediaType.endsWith("+json"));
}

export async function readFacultyAssignmentCommandBody(request: Request): Promise<unknown> {
  if (!facultyAssignmentAcceptsContentType(request.headers.get("content-type"))) {
    throw new FacultyAssignmentBodyError("UNSUPPORTED_ASSIGNMENT_CONTENT_TYPE", 415);
  }

  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const parsed = Number(declared);
    if (!/^\d+$/.test(declared) || !Number.isSafeInteger(parsed)) {
      throw new FacultyAssignmentBodyError("INVALID_ASSIGNMENT_JSON", 400);
    }
    if (parsed > FACULTY_ASSIGNMENT_COMMAND_LIMIT_BYTES) {
      throw new FacultyAssignmentBodyError("ASSIGNMENT_BODY_TOO_LARGE", 413);
    }
  }
  if (!request.body) throw new FacultyAssignmentBodyError("INVALID_ASSIGNMENT_JSON", 400);

  const decoder = new TextDecoder("utf-8", { fatal: true });
  const reader = request.body.getReader();
  let bytes = 0;
  let raw = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > FACULTY_ASSIGNMENT_COMMAND_LIMIT_BYTES) {
        throw new FacultyAssignmentBodyError("ASSIGNMENT_BODY_TOO_LARGE", 413);
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
  } catch (error) {
    if (error instanceof FacultyAssignmentBodyError) throw error;
    throw new FacultyAssignmentBodyError("INVALID_ASSIGNMENT_JSON", 400);
  } finally {
    reader.releaseLock();
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new FacultyAssignmentBodyError("INVALID_ASSIGNMENT_JSON", 400);
  }
}
