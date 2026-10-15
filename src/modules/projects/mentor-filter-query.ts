/** Next searchParams arrays represent repeated keys: never select one silently. */
export function singleValueMentorFilters(
  params: Record<string, string | string[] | undefined>,
): Record<string, string | undefined> | null {
  const entries: [string, string | undefined][] = [];
  for (const [key, value] of Object.entries(params)) {
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
