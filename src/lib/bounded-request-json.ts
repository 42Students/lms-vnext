import { readBoundedUtf8Body } from "@/lib/bounded-utf8-body";

/** A request body the caller got wrong: unreadable, not JSON, or over the size cap. `apiErrorResponse` maps it to 400/413. */
export class RequestBodyError extends Error {
  readonly status: 400 | 413;
  readonly code: "INVALID_REQUEST" | "REQUEST_TOO_LARGE";
  constructor(kind: "INVALID" | "TOO_LARGE") {
    super(kind === "TOO_LARGE" ? "Request body is too large." : "Request body is not valid JSON.");
    this.name = "RequestBodyError";
    this.status = kind === "TOO_LARGE" ? 413 : 400;
    this.code = kind === "TOO_LARGE" ? "REQUEST_TOO_LARGE" : "INVALID_REQUEST";
  }
}

export const DEFAULT_JSON_BODY_BYTES = 2 * 1024 * 1024;

/**
 * Drop-in replacement for `await request.json()`: the same result for a valid body, but the bytes are counted while
 * they stream in, so an oversized body is refused before it is held in memory. Throws `RequestBodyError`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors Request.json(), which callers validate themselves
export async function boundedRequestJson(request: Request, maxBytes = DEFAULT_JSON_BODY_BYTES): Promise<any> {
  const body = await readBoundedUtf8Body(request, maxBytes);
  if (body.kind === "TOO_LARGE") throw new RequestBodyError("TOO_LARGE");
  if (body.kind !== "OK") throw new RequestBodyError("INVALID");
  try {
    return JSON.parse(body.body);
  } catch {
    throw new RequestBodyError("INVALID");
  }
}
