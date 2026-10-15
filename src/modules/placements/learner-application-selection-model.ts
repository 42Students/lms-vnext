/** Do not disclose whether an unavailable application belongs to another learner. */
export function learnerApplicationSelectionMissing<T extends {applicationId:string}>(
 ownRows:readonly T[],selectedId:string|undefined
):boolean{
 return typeof selectedId==="string"&&!ownRows.some(row=>row.applicationId===selectedId);
}
