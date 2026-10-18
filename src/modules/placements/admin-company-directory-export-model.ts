import type {AdminCompanyRow} from "./admin-company-directory-model";
/** Export only explicit non-sensitive fields and neutralize leading spreadsheet formulas. */
export function superAdminCompanyCsv(rows:readonly AdminCompanyRow[]):string {
 const field=(value:string)=>{
  const startsWithFormula=/^[\s\p{Cc}\p{Cf}\p{Mn}\p{Me}]*[=+@-]/u.test(value);
  const safe=startsWithFormula?"'"+value:value;
  return '"'+safe.replace(/"/g,'""')+'"';
 };
 const newline=String.fromCharCode(13,10);
 return [
  ["Company ID","Company","Primary Domain","College","Company status","Relationship status","Trusted","Website","Linked colleges","Drives in college","Last active"].map(field).join(","),
  ...rows.map(row=>[row.companyId,row.name,row.primaryDomain??"",row.collegeName,row.companyStatus,row.relationshipStatus,row.trusted?"Yes":"No",row.website??"",String(row.companyCollegeCount??""),String(row.driveCount??""),row.lastActiveAt?row.lastActiveAt.toISOString():""].map(field).join(",")),
 ].join(newline)+newline;
}
