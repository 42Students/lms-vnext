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
export function ProjectAtRiskPageExport({rows,visibleIds,query=""}:{
 rows:Row[];collegeId:string;visibleIds?:readonly string[];query?:string;
}){
 // CSV must reflect the displayed page after any local text/ID refinement,
 // rather than exporting hidden matches from the same server page.
 const eligible=visibleIds?new Set(visibleIds):null;
 const term=query.trim().toLocaleLowerCase("en-IN");
 const visibleRows=rows.filter(row=>(!eligible||eligible.has(row.id))&&
  (!term||[row.title,row.mentorName,row.status,row.severity,
    row.blockerReason,...row.riskReasons].some(value=>value?.toLocaleLowerCase("en-IN").includes(term))));
 function save(){
  const headings=["Workspace","Mentor","Status","Severity","Risk reasons"];
  const data=visibleRows.map(row=>[
   row.title,row.mentorName??"",row.status??"",
   row.severity==="HIGH_RISK"?"High risk":
   row.severity==="AT_RISK"?"At risk":
   row.severity==="WATCH"?"Watch":
   row.riskReasons.length>=3?"High risk":
   row.riskReasons.length===2?"At risk":"Watch",
   row.riskReasons.join("; "),
  ]);
  const csv=projectAdminCsv([headings,...data]);
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement("a");
  anchor.href=url;anchor.download="at-risk-projects.csv";
  document.body.appendChild(anchor);anchor.click();anchor.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),0);
 }
 return <Button variant="secondary" type="button" onClick={save} disabled={!visibleRows.length}
  aria-label="Export CSV of the visible at-risk workspaces">
  <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"
   fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
   strokeLinejoin="round" className="mr-1 inline-block shrink-0">
   <path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4"/>
  </svg>
  Export CSV
 </Button>;
}
