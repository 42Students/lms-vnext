export const MAX_VERIFICATION_EXPORT_ROWS=1000;
export type VerificationExportRow={learnerName:string;section:string;status:string;submittedAt:string;reviewedAt:string};
function safeCell(value:string):string {
 const neutral=/^[\s\u0000-\u001f]*[=+@-]/u.test(value);
 const text=neutral?"'"+value:value;
 return '"'+text.replace(/"/g,'""')+'"';
}
export function verificationCsv(rows:readonly VerificationExportRow[]):{csv:string;truncated:boolean}{
 const selected=rows.slice(0,MAX_VERIFICATION_EXPORT_ROWS);
 const headers=["Learner","Section","Status","Submitted (IST)","Reviewed (IST)"];
 const lines=[headers.map(safeCell).join(","),
 ...selected.map(r=>[r.learnerName,r.section,r.status,r.submittedAt,r.reviewedAt].map(safeCell).join(","))];
 const truncated=rows.length>MAX_VERIFICATION_EXPORT_ROWS;
 if(truncated) lines.push('"TRUNCATED","Showing first 1000 rows"');
 return {csv:"\uFEFF"+lines.join("\r\n")+"\r\n",truncated};
}
