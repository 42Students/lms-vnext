import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { readBoundedUtf8Body } from "@/lib/bounded-utf8-body";
import { StorageFileError } from "@/modules/storage/file-errors";

import { CACHE } from "@/security/responses";
/** Metadata-only JSON: private file bytes are uploaded directly to storage. */
export const MAX_STORAGE_JSON_BYTES = 64 * 1024;

function invalidBody(message: string) {
  return new ZodError([{ code: "custom", message, path: [] }]);
}

async function readStorageJsonText(request: Request): Promise<string> {
  // Content-Length can be forged or absent; enforce the limit while streaming.
  // Fatal UTF-8 decoding rejects corrupted JSON rather than replacing bytes.
  const result = await readBoundedUtf8Body(request, MAX_STORAGE_JSON_BYTES);
  if (result.kind === "TOO_LARGE") throw new StorageFileError("STORAGE_FILE_TOO_LARGE");
  if (result.kind !== "OK") throw invalidBody("Request body must be valid UTF-8");
  return result.body;
}

/** Parses a bounded JSON request body; malformed or non-object input is a 400. */
export async function readJsonBody(request: Request): Promise<unknown> {
  const text = await readStorageJsonText(request);
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

/** Bounded JSON, preserving optional empty/whitespace-only object semantics. */
export async function readOptionalJsonBody(request: Request): Promise<unknown> {
  const text = await readStorageJsonText(request);
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
  return NextResponse.json(body, { status, headers: { "Cache-Control": CACHE.NONE } });
}
