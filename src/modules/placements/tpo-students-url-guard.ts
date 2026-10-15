/** Never choose the first of repeated query values on an authorized student roster. */
export function tpoStudentUrlError(raw:Record<string,string|string[]|undefined>):string|null {
  if(Object.values(raw).some(value=>Array.isArray(value))) return "Repeated Students filters are not allowed. No student data was loaded.";
  const supported = new Set(["journeyState","branchId","search","page","pageSize","columns"]);
  if(Object.keys(raw).some(key=>!supported.has(key))) return "Unsupported Students filter. No student data was loaded.";
  return null;
}
