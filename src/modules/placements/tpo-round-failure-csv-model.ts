import {z} from "zod";
export const tpoRoundFailureCsvQuerySchema=z.object({
 seasonId:z.string().uuid().optional(),jobId:z.string().uuid().optional(),
}).strict();
export type TpoRoundFailureCsvRow={
 roundName:string;branchName:string;failed:number;decisions:number;
 shareOfRoundPercent:number|null;
};
function escapeCell(value:string|number){
 const raw=String(value);
 const safe=/^\s*[=+\-@\t\r]/.test(raw)?"'"+raw:raw;
 return '"'+safe.replaceAll('"','""')+'"';
}
/** The CSV is derived from the exact rendered branch-denominator model. */
export function tpoRoundFailureCsv(rows:readonly TpoRoundFailureCsvRow[]){
 const lines=[["Round","Branch (current)","Failed decisions","Applied decisions","Share of recorded round decisions"],
  ...rows.map(row=>[row.roundName,row.branchName,String(row.failed),String(row.decisions),
   row.shareOfRoundPercent===null?"Unavailable":row.shareOfRoundPercent+"%"])];
 return "\uFEFF"+lines.map(row=>row.map(escapeCell).join(",")).join("\r\n")+"\r\n";
}
