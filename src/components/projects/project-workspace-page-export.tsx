"use client";
import {useState} from "react";
import {projectAdminCsv} from "@/modules/projects/project-admin-csv-model";
import {collegeWorkspaceStatusLabel} from "@/modules/projects/college-workspace-status-label";
import {formatProjectAdminUpdatedDateIst} from "@/modules/projects/project-admin-date-model";
type Item={id:string;title:string;status:string;mentorName:string|null;memberCount:number;progressPercent:number;updatedAt:Date;riskReasons?:readonly string[]};
export function ProjectWorkspacePageExport({items}:{items:Item[]}){
 const [notice,setNotice]=useState("");
 function exportCsv(){
  const columns=["Workspace ID","Workspace","Mentor","Status","Progress %","Members","Updated at (IST)"];
  const body=items.map(r=>[r.id,r.title,r.mentorName,
    collegeWorkspaceStatusLabel(r.status,r.riskReasons),r.progressPercent,r.memberCount,
    formatProjectAdminUpdatedDateIst(r.updatedAt)]);
  const csv=projectAdminCsv([columns,...body]);
  const file=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(file);const link=document.createElement("a");
  link.href=url;link.download="project-workspaces-page.csv";link.click();URL.revokeObjectURL(url);
  setNotice("Exported "+items.length+" workspaces from this page.");
 }
 return <div className="flex items-center gap-3">
  <button type="button" disabled={!items.length} onClick={exportCsv}
   className="min-h-10 rounded border border-border px-3 text-sm font-semibold disabled:opacity-50">
   Export this page · CSV
  </button>
  {notice?<span role="status" className="text-xs text-body">{notice}</span>:null}
 </div>;
}
