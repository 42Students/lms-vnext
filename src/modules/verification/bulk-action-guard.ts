/** Prevent new previews while the previous batch has not finished saving. */
export function canStartVerificationBulkPreview(busy:boolean,selectedCount:number):boolean{
 return !busy&&selectedCount>0&&selectedCount<=20;
}

/** A pending review must not navigate away from its receipt or initiate a conflicting refresh. */
export function canNavigateCollegeVerificationQueue(bulkBusy:boolean):boolean{
 return !bulkBusy;
}
