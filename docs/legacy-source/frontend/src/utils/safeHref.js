/**
 * A link a student typed (resume, GitHub, portfolio) is only ever opened if it is a plain web address. Anything else
 * (javascript:, data:, a relative path) would run in the viewer's browser, so it is not rendered as a link at all.
 */
export function safeHref(value) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!/^https?:\/\//i.test(v)) return null;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch (_) {
    return null;
  }
}
