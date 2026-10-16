export type CollegeImportResult={status:"CREATED"|"SKIPPED"|"FAILED"};
export function collegeBulkImportToast(rows:readonly CollegeImportResult[]):{
 title:string;tone:"success"|"error"
}{
 const created=rows.filter(row=>row.status==="CREATED").length;
 const skipped=rows.filter(row=>row.status==="SKIPPED").length;
 const failed=rows.filter(row=>row.status==="FAILED").length;
 return {
  title:created+" college"+(created===1?"":"s")+" created; "+skipped+" skipped; "+failed+" failed",
  tone:failed>0||created===0?"error":"success",
 };
}
