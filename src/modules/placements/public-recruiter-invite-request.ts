import { readBoundedUtf8Body } from "@/lib/request-body";

export type NoArgumentInviteRequestResult = "OK" | "INVALID" | "TOO_LARGE";

/**
 * A public bearer link may only trigger its fixed, persisted action. Reject
 * caller-selected parameters, unexpected fields and oversized streamed bodies.
 * Permit the historical empty JSON object sent by older clients.
 */
export async function validateNoArgumentRecruiterInvitePost(
  request: Request,
): Promise<NoArgumentInviteRequestResult> {
  if (new URL(request.url).search) return "INVALID";
  const body = await readBoundedUtf8Body(request, 256);
  if (body.kind === "TOO_LARGE") return "TOO_LARGE";
  if (body.kind !== "OK") return "INVALID";
  const text = body.body.trim();
  if (!text) return "OK";
  if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get("content-type") ?? "")) {
    return "INVALID";
  }
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) &&
      Object.keys(parsed).length === 0 ? "OK" : "INVALID";
  } catch {
    return "INVALID";
  }
}
