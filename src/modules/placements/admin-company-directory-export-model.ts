import type {AdminCompanyRow} from "./admin-company-directory-model";
/** Escape spreadsheet formulas; export only explicit non-sensitive relationship fields. */
export function superAdminCompanyCsv(rows:readonly AdminCompanyRow[]):string {
 const field=(value:string)=>{
  const safe=/^[\\s]*[=+@-]/.test(value)?"'"+value:value;
  return '"'+safe.replace(/"/g,'""')+'"';
 };
 return [
  ["Company","College","Company status","Relationship status","Trusted","Website"].map(field).join(","),
  ...rows.map(row=>[row.name,row.collegeName,row.companyStatus,row.relationshipStatus,row.trusted?"Yes":"No",row.website??""].map(field).join(",")),
 ].join("\\r\\n")+"\\r\\n";
}
