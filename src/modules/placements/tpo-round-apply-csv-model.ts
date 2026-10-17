/** TPO-drive-workspace-42: CSV values neutralized against spreadsheet formulas. */
const cell=(value:unknown)=>{
 const raw=String(value??"");
 const safe=/^[\s]*[=+@\-]/.test(raw)?"'"+raw:raw;
 return '"'+safe.replaceAll('"','""')+'"';
};
export function roundApplyPreviewCsv(rows:readonly {
 student:string;outcome:string;destination:string;status:string;
}[]){
 return [["Learner","Outcome","Destination","Current result status"],...rows.map(row=>[
  row.student,row.outcome,row.destination,row.status,
 ])].map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
}
export function roundApplyReportCsv(rows:readonly {
 student:string;outcome:string;status:string;reason?:string;
}[]){
 return [["Learner","Outcome","Result","Reason"],...rows.map(row=>[
  row.student,row.outcome,row.status,row.reason??"",
 ])].map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
}
