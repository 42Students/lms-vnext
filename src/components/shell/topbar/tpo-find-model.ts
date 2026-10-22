/** Only trusted, same-portal paths from the authenticated TPO suggestions
 * service may become navigable command items. No external or protocol URL.
 */
export type TpoFindResult = { group: string; label: string; href: string };

export function safeTpoFindResult(value: unknown): value is TpoFindResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  if (typeof row["group"] !== "string" || !row["group"].trim() || row["group"].length > 80 ||
      typeof row["label"] !== "string" || !row["label"].trim() || row["label"].length > 240 ||
      typeof row["href"] !== "string" || row["href"].length > 2048) return false;
  // A protocol-relative URL or a backslash can be normalized by a browser
  // into an external navigation; escaped and control-character paths fail closed.
  if (!/^\/tpo\/(?!\/)[^\\\u0000-\u001f\u007f]*$/.test(row["href"])) return false;
  const path = row["href"].split(/[?#]/, 1)[0]!;
  // Canonicalization must not move a result outside the TPO portal.
  // Encoded slash, dot and backslash path separators are not permitted.
  if (/%(?:2e|2f|5c)/i.test(path) || /%(?![0-9a-f]{2})/i.test(path)) return false;
  if (/(?:^|\/)\.{1,2}(?=\/|$)/.test(path)) return false;
  try {
    const url = new URL(row["href"], "https://lms.invalid");
    return url.origin === "https://lms.invalid" &&
      url.pathname.startsWith("/tpo/") && !url.pathname.startsWith("/tpo//");
  } catch {
    return false;
  }
}
