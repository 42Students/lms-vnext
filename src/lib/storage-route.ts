import { NextResponse } from "next/server";
import { ZodError } from "zod";

function invalidBody(message: string) {
  return new ZodError([{ code: "custom", message, path: [] }]);
}

/** Parses a JSON request body; malformed or non-object input becomes a 400 INVALID_REQUEST. */
export async function readJsonBody(request: Request): Promise<unknown> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    throw invalidBody("Request body must be valid JSON");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw invalidBody("Request body must be a JSON object");
  }
  return parsed;
}

/** Like readJsonBody, but an absent or empty body is treated as an empty object (optional payloads). */
export async function readOptionalJsonBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (text.trim() === "") return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw invalidBody("Request body must be valid JSON");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw invalidBody("Request body must be a JSON object");
  }
  return parsed;
}

/** JSON response that must never be cached (carries short-lived signed URLs or private state). */
export function storageJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
