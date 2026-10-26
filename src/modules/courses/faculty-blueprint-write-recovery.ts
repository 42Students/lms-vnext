/** Reconciliation policy for Faculty Blueprint writes.
 * A transport failure, server error or stale-version conflict cannot be
 * safely retried from an optimistic local snapshot. Only a fresh authorized
 * read may determine the persisted order or archive state.
 */
export function facultyBlueprintWriteNeedsReload(httpStatus:number|null):boolean{
 return httpStatus===null || httpStatus===408 || httpStatus===409 ||
  httpStatus===412 || httpStatus>=500;
}
