/** Preserve the API's ordered string[] contract while accepting legacy newline values. */
export function normalizeCourseTakeaways(value) {
  const entries = Array.isArray(value) ? value : typeof value === "string" ? value.split(/\r?\n/) : [];
  return entries.map((entry) => String(entry ?? "").trim()).filter(Boolean);
}

/** Trim pasted bullet/number prefixes without stripping meaningful punctuation inside a point. */
export function parsePastedCourseTakeaways(text) {
  return normalizeCourseTakeaways(text).map((line) =>
    line.replace(/^\s*(?:[-*•]\s+|\d+[.)]\s+)/, "").trim()
  ).filter(Boolean);
}
