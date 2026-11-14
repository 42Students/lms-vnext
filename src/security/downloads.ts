/**
 * The one builder of a download's Content-Disposition. Filenames are never trusted: path separators, quotes, control
 * characters and header-breaking newlines are removed so a name built from data (a job id, a company) cannot inject a header
 * or point the browser at another path. Non-ASCII names get an RFC 5987 `filename*` so they survive, with an ASCII fallback.
 */
const MAX_NAME = 120;
// Unicode line and paragraph separators, built from code points so no raw separator sits in this source file.
const LINE_SEPARATORS = new RegExp("[" + String.fromCharCode(0x2028) + String.fromCharCode(0x2029) + "]", "g");
const CONTROL_CHARACTERS = new RegExp("[" + String.fromCharCode(0) + "-" + String.fromCharCode(0x1f) + String.fromCharCode(0x7f) + "]", "g");
const PATH_AND_HEADER_CHARACTERS = /[\\/:*?"<>|;]/g;
const NON_ASCII = new RegExp("[^" + String.fromCharCode(0x20) + "-" + String.fromCharCode(0x7e) + "]", "g");

export function safeDownloadFilename(name: string): string {
  const cleaned = name
    .normalize("NFKC")
    .replace(CONTROL_CHARACTERS, "")
    .replace(LINE_SEPARATORS, " ")
    .replace(PATH_AND_HEADER_CHARACTERS, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "");
  const limited = cleaned.length > MAX_NAME ? cleaned.slice(0, MAX_NAME) : cleaned;
  return limited || "download";
}

export function attachmentHeader(filename: string): string {
  const safe = safeDownloadFilename(filename);
  const ascii = safe.replace(NON_ASCII, "_");
  if (ascii === safe) return `attachment; filename="${safe}"`;
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}
