export const HR_INBOX_CSV_CAP = 200;
export type HrInboxExportRow = {
  id:string;jobId:string;title:string;label:string;createdAt:Date;unread:boolean;
};
function safeCsvCell(value:string){
 const safe=/^\s*[=+\-@]/u.test(value)||/^[\t\r\n]/u.test(value)?"'"+value:value;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function buildHrInboxCsv(rows:readonly HrInboxExportRow[],total:number){
 const out=[["Drive","Lifecycle event","Received (IST)","Unread"].map(safeCsvCell).join(",")];
 const selected=rows.slice(0,HR_INBOX_CSV_CAP);
 const date=new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
 });
 for(const item of selected){
  const received=Number.isFinite(item.createdAt.getTime())
   ?date.format(item.createdAt):"Date unavailable";
  out.push([item.title,item.label,received,
   item.unread?"Yes":"No"].map(safeCsvCell).join(","));
 }
 const authorizedTotal=Number.isSafeInteger(total)&&total>=0?total:selected.length;
 const omitted=Math.max(0,authorizedTotal-selected.length);
 if(omitted)out.push(["Export capped","Additional authorized notifications omitted","",""]
  .map(safeCsvCell).join(","));
 return {csv:"\uFEFF"+out.join("\r\n")+"\r\n",exported:selected.length,omitted};
}
