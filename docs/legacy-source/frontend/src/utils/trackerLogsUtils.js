export function logIdentity(entry) {
  if (!entry) return "";
  return [
    entry.logName || "",
    entry.insertId || "",
    entry.timestamp || "",
  ].join("|");
}

export function mergeLogEntries(newer = [], existing = []) {
  const seen = new Set();
  const merged = [];

  [...newer, ...existing].forEach((entry) => {
    const key = logIdentity(entry);
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(entry);
  });

  return merged;
}
