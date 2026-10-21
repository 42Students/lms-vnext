/** Spreadsheet-safe export for the college-scoped company drives already displayed. */
export type CompanyDriveCsvRow={
  jobTitle:string;status:string;createdAt:string;applied:number|null;offers:number|null;
};
export function companyDriveCsv(rows:readonly CompanyDriveCsvRow[]){
 const cell=(input:string)=>{
  const cleaned=input.replace(/\u0000/g,"");
  const literal=/^\s*[=+\-@]/.test(cleaned)?"'"+cleaned:cleaned;
  return '"'+literal.replace(/"/g,'""')+'"';
 };
 const records=[["Role","Status","Year","Applied","Offers","Created"],...rows.map(row=>[
  row.jobTitle,row.status,
  new Intl.DateTimeFormat("en-IN",{year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(row.createdAt)),
  row.applied===null?"Unavailable":String(row.applied),
  row.offers===null?"Unavailable":String(row.offers),
  new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(row.createdAt)),
 ])];
 return "\uFEFF"+records.map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
}
