export const HR_ACTIVITY_CSV_CAP=200;
export type HrActivityCsvRow={id:string;jobId:string;title:string;status:string;occurredAt:Date};
function cell(text:string){
 const safe=/^\s*[=+\-@]/u.test(text)||/^[\t\r\n]/u.test(text)?"'"+text:text;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function buildHrActivityCsv(rows:readonly HrActivityCsvRow[],additionalRows:boolean){
 const exportRows=rows.slice(0,HR_ACTIVITY_CSV_CAP);
 const out=[["Drive ID","Drive","Event","Occurred (IST)"].map(cell).join(",")];
 const dateFormat=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",day:"2-digit",
  month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false});
 for(const row of exportRows) {
  const date=Number.isFinite(row.occurredAt.getTime())
   ?dateFormat.format(row.occurredAt):"Date unavailable";
  out.push([row.jobId,row.title,row.status,date].map(cell).join(","));
 }
 const capped=additionalRows||rows.length>HR_ACTIVITY_CSV_CAP;
 if(capped)out.push(["Export capped","Additional authorized events omitted","",""].map(cell).join(","));
 return {csv:"\uFEFF"+out.join("\r\n")+"\r\n",exported:exportRows.length,capped};
}
