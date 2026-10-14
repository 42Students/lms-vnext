export const HR_TEAM_CSV_CAP = 200;
export type HrTeamCsvMember={displayName:string|null;title:string|null;email:string|null;isYou:boolean};
function escapeCell(text:string){
 const safe=/^\s*[=+\-@]/u.test(text)||/^[\t\r\n]/u.test(text)?"'"+text:text;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function buildHrTeamCsv(members:readonly HrTeamCsvMember[]){
 const exported=members.slice(0,HR_TEAM_CSV_CAP);
 const output=[["Recruiter","Designation","Company email","You"].map(escapeCell).join(",")];
 for(const member of exported){
  output.push([member.displayName??"Recruiter",member.title??"Recruiter",
   member.email??"",member.isYou?"Yes":"No"].map(escapeCell).join(","));
 }
 const truncated=members.length>HR_TEAM_CSV_CAP;
 if(truncated)output.push(["Export capped","Additional authorized teammates omitted","",""]
   .map(escapeCell).join(","));
 return {csv:"\uFEFF"+output.join("\r\n")+"\r\n",exported:exported.length,truncated};
}
