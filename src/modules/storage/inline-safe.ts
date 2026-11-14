import { attachmentHeader } from "@/security/downloads";
/**
 * Which stored content types may be shown inline by a signed file link. Everything else (HTML, SVG, XML, scripts,
 * unknown types) must always be sent as a download so it can never run on the file host or our own origin.
 * Pure, safe to import anywhere (no I/O).
 */
const INLINE_SAFE = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
]);

export function normalizeStoredContentType(value: string | null | undefined): string {
  return (value ?? "").split(";")[0]!.trim().toLowerCase();
}

export function isInlineSafeContentType(value: string | null | undefined): boolean {
  return INLINE_SAFE.has(normalizeStoredContentType(value));
}

/** RFC 6266 attachment header value with a conservative ASCII file name. */
export function attachmentDisposition(fileName: string): string {
  const safe = fileName.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 120) || "download";
  return attachmentHeader(`${safe}`);
}
