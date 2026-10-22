"use client";
import { Button } from "@/components/ui/button";
import {useState} from "react";
import {projectAdminCsv} from "@/modules/projects/project-admin-csv-model";
import {collegeWorkspaceStatusLabel} from "@/modules/projects/college-workspace-status-label";
type Item={id:string;title:string;status:string;mentorName:string|null;memberCount:number;progressPercent:number;updatedAt:Date;templateId?:string|null;riskReasons?:readonly string[]};
export function ProjectWorkspacePageExport({items}:{items:Item[]}){
 const [notice,setNotice]=useState("");
 function exportCsv(){
  const columns=["Workspace","Status","Progress","Mentor","Template ID"];
  const body=items.map(item=>[
    item.title,collegeWorkspaceStatusLabel(item.status,item.riskReasons),
    item.progressPercent+"%",item.mentorName??"",item.templateId??"",
  ]);
  const csv=projectAdminCsv([columns,...body]);
  const file=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(file);const link=document.createElement("a");
  link.href=url;link.download="project-workspaces-page.csv";link.click();URL.revokeObjectURL(url);
  setNotice("Exported "+items.length+" workspaces from this page.");
 }
 return <div className="flex min-w-0 flex-wrap items-center gap-3">
  <Button variant="secondary" type="button" disabled={!items.length} onClick={exportCsv}
   className="">
   <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-2 inline size-4"
     fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
     strokeLinejoin="round"><path d="M12 3v12m-4-4 4 4 4-4"/><path d="M4 17v4h16v-4"/></svg>
   Export this page
  </Button>
  {notice?<span role="status" className="text-xs text-body">{notice}</span>:null}
 </div>;
}
