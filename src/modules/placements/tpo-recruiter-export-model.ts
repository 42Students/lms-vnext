/** Formula-neutralized CSV for TPO Engage exports. Never include invite tokens. */
export type RecruiterExportRow={
 name:string;companyName:string|null;stage:string;ownerName:string|null;
 emailNorm:string|null;phoneNorm:string|null;source:string|null;
 inviteStatus:string;lastActivityAt:string|null;nextFollowupAt:string|null;createdAt:string;
};
export const RECRUITER_CSV_HEADERS=[
 "Contact","Company","Stage","Owner","Email","Phone","Source",
 "Invite","Last activity","Next follow-up","Added",
] as const;
export function recruiterCsvCell(value:unknown){
 const raw=String(value??"").replace(/\u0000/g,"");
 const safe=/^[\s]*[=+\-@]/.test(raw)?"'"+raw:raw;
 return '"'+safe.replace(/"/g,'""')+'"';
}
export function recruiterLeadsCsv(rows:readonly RecruiterExportRow[]){
 const lines=[RECRUITER_CSV_HEADERS.map(recruiterCsvCell).join(",")];
 for(const row of rows){
  lines.push([
   row.name,row.companyName,row.stage,row.ownerName,row.emailNorm,row.phoneNorm,
   row.source,row.inviteStatus,row.lastActivityAt,row.nextFollowupAt,row.createdAt,
  ].map(recruiterCsvCell).join(","));
 }
 return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
