/** RFC4180 CSV escaping with spreadsheet-formula protection for untrusted labels. */
export function safeCollegeCsvCell(value:string|number|Date|null|undefined):string {
 const raw=value instanceof Date?value.toISOString():String(value??"");
 const clean=raw.replaceAll("\u0000","");
 const neutral=/^[\\s]*[=+@-]/.test(clean)?"'"+clean:clean;
 return '"'+neutral.replaceAll('"','""')+'"';
}
export function collegeDirectoryCsv(headers:readonly string[],rows:readonly (readonly (string|number|Date|null|undefined)[])[]):string {
 return "\uFEFF"+[headers,...rows].map(row=>row.map(safeCollegeCsvCell).join(",")).join("\r\n")+"\r\n";
}
export function collegeCompanyCsv(rows:readonly {
 companyId:string;name:string;industry:string|null;websiteUrl:string|null;drives:number;
 companyStatus:string;relationshipStatus:string;
}[]):string {
 return collegeDirectoryCsv(
  ["id","name","industry","website","contact person","contact email","contact phone","drive count","deleted"],
  rows.map(row=>[row.companyId,row.name,row.industry,row.websiteUrl,
   // The current canonical company schema stores no public contact-person fields.
   // Preserve empty columns instead of fabricating personal information.
   "","","",row.drives,
   row.companyStatus==="ARCHIVED"||row.relationshipStatus==="ARCHIVED"?"Yes":"No"]),
 );
}
export function collegeInterviewCsv(rows:readonly {
 id:string;job:string;student:string;kind:string;status:string;start:Date;venue:string|null;mode:string;
}[]):string {
 return collegeDirectoryCsv(["id","job","candidate","type","status","scheduled date (IST)","interviewer","location","mode"],
  rows.map(row=>[row.id,row.job,row.student,row.kind,row.status,
   new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(row.start)+" IST",
   "",row.venue,row.mode]));
}
