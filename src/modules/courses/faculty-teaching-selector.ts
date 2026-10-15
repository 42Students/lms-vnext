/** A request cannot use stale, unknown or another Faculty's teaching Section. */
export function facultyTeachingSelectionAllowed(
 current:readonly {deliveryId:string}[],requested:string|undefined,
):boolean{
 return requested===undefined||current.some(row=>row.deliveryId===requested);
}
