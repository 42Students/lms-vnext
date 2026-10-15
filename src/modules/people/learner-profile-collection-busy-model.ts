/** A mutation in progress freezes collection controls to prevent an
 * older optimistic snapshot from replacing newly saved profile entries. */
export function learnerProfileCollectionMayEdit(
 profileSaving:boolean,contactsSaving:boolean,
):boolean {
 return !profileSaving&&!contactsSaving;
}
