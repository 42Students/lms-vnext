import type {AdminCompanyRow} from "./admin-company-directory-model";
/** Export only explicit non-sensitive fields and neutralize leading spreadsheet formulas. */
export function superAdminCompanyCsv(rows:readonly AdminCompanyRow[]):string {
 const field=(value:string)=>{
  const startsWithFormula=["=","+","-","@"].includes(value.trimStart().charAt(0));
  const safe=startsWithFormula?"'"+value:value;
  return '"'+safe.replace(/"/g,'""')+'"';
 };
 const newline=String.fromCharCode(13,10);
 return [
  ["Company","College","Company status","Relationship status","Trusted","Website"].map(field).join(","),
  ...rows.map(row=>[row.name,row.collegeName,row.companyStatus,row.relationshipStatus,row.trusted?"Yes":"No",row.website??""].map(field).join(",")),
 ].join(newline)+newline;
}
