/** Prevent new previews while the previous batch has not finished saving. */
export function canStartVerificationBulkPreview(busy:boolean,selectedCount:number):boolean{
 return !busy&&selectedCount>0&&selectedCount<=20;
}
