/**
 * Native FormData preserves every selected team membership as one form entry.
 * Never comma-join UUIDs: the thread-create endpoint uses getAll() and the
 * validator rejects an otherwise valid group as a single malformed UUID.
 */
export function buildTpoTeamFormData(
  values: Record<string, string | readonly string[]>,
): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string") {
      form.set(key, value);
    } else {
      for (const item of value) form.append(key, item);
    }
  }
  return form;
}
