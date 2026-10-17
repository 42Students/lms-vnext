"use client";
import {Button} from "@/components/ui/button";

type Row={
 id:string; title:string; mentorName:string|null; inactiveDays:number;
 riskReasons:string[]; blockerReason:string|null; lastActivityAt:string;
};
/** SA-placements-projects-63: export exactly the visible, tenant-scoped page. */
export function ProjectAtRiskPageExport({rows,collegeId}:{rows:Row[];collegeId:string}){
 function save(){
  const cells=(values:(string|number|null)[])=>values.map(value=>{
   const text=String(value??"");
   const safe=/^[\s]*[=+@-]/.test(text)?"'"+text:text;
   return '"'+safe.replaceAll('"','""')+'"';
  }).join(",");
  const header=cells(["Workspace ID","Workspace","Mentor","Severity","Risk reasons",
   "Inactive days","Blocker","Last activity (UTC)"]);
  const csv=[header,...rows.map(row=>cells([row.id,row.title,row.mentorName,
   row.riskReasons.length>1||row.blockerReason?"Risk":"Watch",
   row.riskReasons.join("; "),row.inactiveDays,row.blockerReason,row.lastActivityAt]))].join("\r\n")+"\r\n";
  const blob=new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement("a");
  anchor.href=url;anchor.download="at-risk-projects-college-"+collegeId+"-"+new Date().toISOString().slice(0,10)+".csv";
  document.body.appendChild(anchor);anchor.click();anchor.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),0);
 }
 return <Button variant="secondary" size="sm" onClick={save} disabled={!rows.length}>
  Export this page
 </Button>;
}
