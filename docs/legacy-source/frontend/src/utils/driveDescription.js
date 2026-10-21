/**
 * A drive's description is stored as simple HTML (paragraphs), shown to students with RichTextDisplay, and edited as plain text in
 * the TPO's drive form and the recruiter's request form. Older admin pages saved it HTML-escaped ("&lt;p&gt;..."), which showed the
 * tags to students and in the edit box (night audit 13 Oct 2026).
 */

const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

/** HTML that was escaped once too often ("&lt;p&gt;Hi&lt;/p&gt;" and no real tags) comes back as the HTML it was. */
export function unescapeStoredHtml(raw) {
  if (!raw) return raw;
  const s = String(raw);
  return !/[<>]/.test(s) && /&lt;\/?[a-z][a-z0-9]*[\s/&]*/i.test(s) ? decode(s) : s;
}

/** The description as the text a person edits: paragraphs as blank lines, list items as bullets, no tags. */
export function descriptionText(raw) {
  if (!raw) return raw;
  const s = String(raw);
  if (!/[<>]|&lt;|&gt;|&amp;/.test(s)) return s;
  // A paragraph ends with a blank line (so the text goes back to the same paragraphs); a list item or a line break with one.
  return decode(s).replace(/<\s*br\s*\/?>/gi, "\n").replace(/<\/(p|div|h[1-6]|ul|ol)\s*>/gi, "\n\n").replace(/<\/li\s*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ").replace(/<[^>]+>/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Plain text from a form as the description's HTML: a paragraph for each blank-line-separated block, line breaks kept. */
export function descriptionHtml(text) {
  if (text == null) return text;
  const t = String(text).trim();
  if (!t) return "";
  return t.split(/\r?\n\s*\r?\n/).map((p) => `<p>${escapeHtml(p.trim()).replace(/\r?\n/g, "<br>")}</p>`).join("");
}
