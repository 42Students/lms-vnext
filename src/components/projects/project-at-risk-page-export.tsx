"use client";
import {Button} from "@/components/ui/button";
import {projectAdminCsv} from "@/modules/projects/project-admin-csv-model";

type Row={
 id:string; title:string; mentorName:string|null; inactiveDays:number;
 riskReasons:string[]; blockerReason:string|null; lastActivityAt:string;
 /** Display status from the college-scoped project row; no ID-derived guesses. */
 status?:string|null;
 severity?:string|null;
};
/** SA-placements-projects-63: export exactly the visible, tenant-scoped page. */
export function ProjectAtRiskPageExport({rows,collegeId}:{rows:Row[];collegeId:string}){
 function save(){
  const headings=["Workspace","Mentor","Status","Severity","Risk reasons"];
  const data=rows.map(row=>[
   row.title,row.mentorName??"",row.status??"",
   row.severity??(row.riskReasons.length>1||row.blockerReason?"Risk":"Watch"),
   row.riskReasons.join("; "),
  ]);
  const csv=projectAdminCsv([headings,...data]);
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement("a");
  anchor.href=url;anchor.download="at-risk-projects-college-"+collegeId+"-"+new Date().toISOString().slice(0,10)+".csv";
  document.body.appendChild(anchor);anchor.click();anchor.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),0);
 }
 return <Button variant="secondary" onClick={save} disabled={!rows.length}>
  Export this page
 </Button>;
}
