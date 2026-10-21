// Client-side mirror of the backend's LogSignatureUtil normalization -- good enough for grouping
// visually-identical entries on the currently-loaded page (a burst of the same error repeating)
// without needing a round trip. Not used for anything security- or alerting-sensitive; that lives
// server-side in LogAlertingService, which is the actual source of truth for "new vs known".
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/gi;
const NUMBER_RE = /\b\d+\b/g;
const WHITESPACE_RE = /\s+/g;

export function normalizeLogShape(entry) {
  const base = `${entry?.message || ""}@${entry?.httpPath || ""}`;
  return base
    .toLowerCase()
    .replace(UUID_RE, "<uuid>")
    .replace(EMAIL_RE, "<email>")
    .replace(NUMBER_RE, "<n>")
    .replace(WHITESPACE_RE, " ")
    .trim();
}

/**
 * Groups consecutive-or-not entries sharing the same normalized shape and severity. Returns the
 * list in original order, each item either a single entry (`{ entry, count: 1 }`) or a collapsed
 * group (`{ entry: <first occurrence>, count: N, occurrences: [...] }`) so a burst of the same
 * error doesn't bury one distinct problem under repeats of another.
 */
export function groupLogEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  const byShape = new Map();
  const order = [];
  entries.forEach((entry) => {
    const key = `${entry?.severity || ""}::${normalizeLogShape(entry)}`;
    if (!byShape.has(key)) {
      const group = { entry, count: 1, occurrences: [entry] };
      byShape.set(key, group);
      order.push(group);
    } else {
      const group = byShape.get(key);
      group.count += 1;
      group.occurrences.push(entry);
    }
  });
  return order;
}
