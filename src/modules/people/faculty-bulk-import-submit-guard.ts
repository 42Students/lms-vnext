/** A dialog can remain open while the operator chooses another file.
 * Only the currently validated CSV is eligible for a destructive import. */
export function canSubmitFacultyBulkImport(input:{
  busy:boolean;
  count:number;
  issue:string;
  error:string;
  filename:string;
  snapshotVersion:number;
  currentVersion:number;
  csvMatchesLoaded:boolean;
}):boolean{
  return !input.busy&&
    Number.isSafeInteger(input.count)&&input.count>0&&input.count<=500&&
    !input.issue&&!input.error&&
    input.filename.toLowerCase().endsWith(".csv")&&
    input.snapshotVersion===input.currentVersion&&
    input.csvMatchesLoaded;
}
