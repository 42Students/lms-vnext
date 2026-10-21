import {ENGAGE_COLUMNS,type EngageColumn} from "./tpo-recruiter-table-view-model";
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

/** The columns currently shown in the Engage table; exclude selection/actions. */
export const RECRUITER_TABLE_HEADERS=[
 "Contact","Status","Stage","Company","Designation","Email","Phone","Flags",
 "Owner","Last activity","Next follow-up","Invite","Added","Came from",
 "Company drives","Students placed",
] as const;
export type RecruiterTableExportRow=RecruiterExportRow&{
 recruiterUserId?:string|null;unsubscribedAt?:string|null;
 chips?:readonly string[];quietDays?:number;drivesRan?:number|null;
 designation?:string|null;studentsPlaced?:number|null;
};
function exportDate(date:string|null){
 if(!date)return "";
 return new Intl.DateTimeFormat("en-GB",{
  day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata",
 }).format(new Date(date));
}
const stageLabels:Record<string,string>={
 NEW:"New",CONTACTED:"Contacted",INVITED:"Invited",JOINED:"Joined",
 DRIVE_PLANNED:"Drive planned",RECRUITED:"Recruited",NOT_NOW:"Not now",
};
export function recruiterTableExportGrid(rows:readonly RecruiterTableExportRow[], columns?:readonly EngageColumn[]){
 const grid={
  headers:[...RECRUITER_TABLE_HEADERS],
  values:rows.map(row=>[
   row.name,
   row.recruiterUserId?"Joined":row.unsubscribedAt?"Unsubscribed":"Not joined",
   stageLabels[row.stage]??row.stage,row.companyName??"Not set",
   row.designation??"",row.emailNorm??"",row.phoneNorm??"",
   (row.chips??[]).map(chip=>chip==="QUIET"?"Quiet "+(row.quietDays??0)+"d":chip).join("; "),
   row.ownerName??"Unassigned",exportDate(row.lastActivityAt),exportDate(row.nextFollowupAt),
   row.inviteStatus,exportDate(row.createdAt),row.source??"Manual",
   row.drivesRan==null?"":String(row.drivesRan),
   row.studentsPlaced==null?"":String(row.studentsPlaced),
  ]),
 };
 if(!columns)return grid;
 const selected=new Set(columns.filter(column=>ENGAGE_COLUMNS.includes(column)));
 const indices=RECRUITER_TABLE_HEADERS.flatMap((column,index)=>selected.has(column)?[index]:[]);
 return {headers:indices.map(index=>grid.headers[index]),
  values:grid.values.map(row=>indices.map(index=>row[index]))};
}
export function recruiterTableExportCsv(rows:readonly RecruiterTableExportRow[], columns?:readonly EngageColumn[]){
 const grid=recruiterTableExportGrid(rows,columns);
 return "\uFEFF"+[grid.headers,...grid.values].map(row=>
  row.map(recruiterCsvCell).join(",")).join("\r\n")+"\r\n";
}
export function recruiterTableExportTsv(rows:readonly RecruiterTableExportRow[], columns?:readonly EngageColumn[]){
 const grid=recruiterTableExportGrid(rows,columns);
 // Literal text clipboard, not formulas: sanitize spreadsheet trigger characters.
 return [grid.headers,...grid.values].map(row=>row.map(value=>{
  const safe=/^[\s]*[=+\-@]/.test(value)?"'"+value:value;
  return safe.replace(/[\t\r\n]/g," ");
 }).join("\t")).join("\r\n");
}
