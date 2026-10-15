/** Fail closed on ambiguous application pipeline filter parameters. */
export function tpoApplicationUrlError(raw:Record<string,string|string[]|undefined>):string|null {
 if(Object.values(raw).some(value=>Array.isArray(value)))return "Repeated applicant filters are not allowed.";
 return null;
}
