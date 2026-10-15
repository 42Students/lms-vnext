/** Fail closed on ambiguous application pipeline filter parameters. */
export function tpoApplicationUrlError(raw:Record<string,string|string[]|undefined>):string|null {
 if(Object.values(raw).some(value=>Array.isArray(value)))return "Repeated applicant filters are not allowed.";
 const allowed=new Set(["stage","search","page","channel","eligibility","sort","submittedWithin","columns"]);
 if(Object.keys(raw).some(key=>!allowed.has(key)))return "Unsupported applicant filter. No application records were loaded.";
 return null;
}
