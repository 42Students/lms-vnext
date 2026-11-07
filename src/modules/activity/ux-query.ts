/** Preserve the investigator's scoped filters when switching activity views.
 * Cursor pagination is intentionally left behind when the query changes.
 * The caller supplies only server-authorized context and validated date values.
 */
export type ActivityQuickQueryOptions = {
  params: Record<string, string | string[] | undefined>;
  view: string;
  from?: string;
  to?: string;
  range?: string;
  rawMode: boolean;
  superAdmin: boolean;
  pinnedCollegeId?: string | null;
};

const CONTEXT_KEYS = [
  "module", "importance", "actorUserId", "eventType",
  "subjectType", "subjectId", "actorName", "q", "size", "collegeId",
] as const;

export function activityQuickHref(options: ActivityQuickQueryOptions): string {
  const query = new URLSearchParams();
  for (const key of CONTEXT_KEYS) {
    if (!options.superAdmin && (key === "actorName" || key === "q" || key === "collegeId")) continue;
    if (key === "collegeId" && options.pinnedCollegeId) continue;
    if (key === "size" && !options.rawMode) continue;
    const original = options.params[key];
    const value = Array.isArray(original) ? original[0] : original;
    if (value && value.length <= 500) query.set(key, value);
  }
  query.set("view", options.view);
  if (options.rawMode) query.set("mode", "raw");
  if (options.from) query.set("from", options.from);
  if (options.to) query.set("to", options.to);
  // No dates means an intentional all-time selection, not a silent 30-day reset.
  if (!options.from && !options.to) query.set("range", "ALL");
  else if (options.range) query.set("range", options.range);
  return "/activity?" + query.toString();
}
