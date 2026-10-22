export type TraceRouteParam = string | string[] | undefined;
const keys = ["q","page","membershipId","overridesOnly","overridesModule","storedValue"] as const;
export function strictTraceRouteParams(raw:Record<string,TraceRouteParam>):Record<(typeof keys)[number],string|undefined>|null {
 if(Object.keys(raw).some(key=>!(keys as readonly string[]).includes(key)))return null;
 if(keys.some(key=>Array.isArray(raw[key])))return null;
 return {q:raw["q"] || undefined,page:raw["page"] || undefined,membershipId:raw["membershipId"] || undefined,overridesOnly:raw["overridesOnly"] || undefined,overridesModule:raw["overridesModule"] || undefined,storedValue:raw["storedValue"] || undefined} as Record<(typeof keys)[number],string|undefined>;
}
