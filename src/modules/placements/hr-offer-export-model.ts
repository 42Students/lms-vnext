export const HR_OFFER_EXPORT_CAP=200;
export type HrOfferCsvRow={
 id:string;name:string|null;role:string;status:string;
 annualCtcInr:number|null;joiningDate:string|null;issuedAt:Date;
 expiresAt:Date|null;joiningStatus:string|null;
};
function cell(value:string){
 const safe=/^\s*[=+\-@]/u.test(value)||/^[\t\r\n]/u.test(value)?"'"+value:value;
 return '"'+safe.replaceAll('"','""')+'"';
}
function ist(value:Date|null){
 return value && Number.isFinite(value.getTime())?new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",day:"2-digit",month:"2-digit",year:"numeric",
  hour:"2-digit",minute:"2-digit",hour12:false,
 }).format(value):"";
}
export function buildHrOfferCsv(rows:readonly HrOfferCsvRow[],total:number){
 const headers=["Offer ID","Applicant","Role","Status","Annual CTC (INR)",
  "Issued (IST)","Reply by (IST)","Joining date","Joining outcome","Contact"];
 const exported=rows.slice(0,HR_OFFER_EXPORT_CAP);
 const out=[headers.map(cell).join(",")];
 for(const row of exported)out.push([
  row.id,row.name??"Candidate",row.role,row.status,
  row.annualCtcInr?.toString()??"",ist(row.issuedAt),ist(row.expiresAt),
  row.joiningDate??"",row.joiningStatus??"Not recorded","Masked",
 ].map(cell).join(","));
 const authorizedTotal=Number.isSafeInteger(total)&&total>=0?total:exported.length;
 const omitted=Math.max(0,authorizedTotal-exported.length);
 if(omitted)out.push(["","Export capped",omitted+" additional authorized offers",
  "","","","","","",""].map(cell).join(","));
 return {csv:"\uFEFF"+out.join("\r\n")+"\r\n",omitted,exported:exported.length};
}
