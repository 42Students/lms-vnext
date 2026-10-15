/** A client-side navigation may retain component state; never render another quiz's draft/results. */
export function learnerQuizRouteScopeCurrent(routeKey:string,loadedKey:string|null):boolean {
 return loadedKey!==null && routeKey===loadedKey;
}
