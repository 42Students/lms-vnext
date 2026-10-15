/** Never choose the first of repeated query values on an authorized student roster. */
export function tpoStudentUrlError(raw:Record<string,string|string[]|undefined>):string|null {
  if(Object.values(raw).some(value=>Array.isArray(value))) return "Repeated Students filters are not allowed. No student data was loaded.";
  return null;
}
