/** Next searchParams arrays represent repeated keys: never select one silently. */
export function singleValueMentorFilters(
  params: Record<string, string | string[] | undefined>,
): Record<string, string | undefined> | null {
  // Legacy bookmarks can contain unrelated selector keys: do not pass them
  // to the strict query schema or let them influence tenant scope.
  const allowed = new Set([
    "search", "status", "segment", "feedback", "attention", "assignment", "work", "sort", "page", "pageSize",
    "view", "age", "version", "priority", "importance", "outcome", "required",
    // Named project filters are user-selectable but must reach strict Zod UUID/state validation.
    "projectId", "projectStatus", "sprintId", "releaseStatus", "sprintStatus", "role", "primary",
    "link", "description", "order", "type",
  ]);
  const entries: [string, string | undefined][] = [];
  for (const [key, value] of Object.entries(params)) {
    if (!allowed.has(key)) continue;
    if (Array.isArray(value)) {
      if (value.length !== 1) return null;
      entries.push([key, value[0]]);
    } else {
      entries.push([key, value]);
    }
  }
  return Object.fromEntries(entries);
}

/** GET export filters must never collapse duplicated or unrecognized keys. */
export function singleValueMentorExportFilters(
  params: URLSearchParams,
  allowed: readonly string[],
): Record<string, string> | null {
  const accepted=new Set(allowed);
  const fields:Record<string,string>={};
  for(const [key,value] of params){
    if(!accepted.has(key)||Object.prototype.hasOwnProperty.call(fields,key))return null;
    fields[key]=value;
  }
  return fields;
}
