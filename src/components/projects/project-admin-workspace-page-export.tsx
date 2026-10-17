"use client";
import {Button} from "@/components/ui/button";
import type {ProjectAdminWorkspaceListItem} from "./project-admin-workspace-list";
function cell(value:string|number|null){
 const raw=String(value??"");
 const safe=/^\s*[=+\-@\t\r]/.test(raw)?"'"+raw:raw;
 return '"'+safe.replaceAll('"','""')+'"';
}
/** COL-projects-08: only the already authorized visible page, never all tenant rows. */
export function ProjectAdminWorkspacePageExport({items}:{items:readonly ProjectAdminWorkspaceListItem[]}){
 function download(){
  const headings=["Workspace","Mentor","Status","Progress %","Members","Last changed (IST)"];
  const rows=items.map(item=>[
   item.title,item.mentorName??"Unassigned",item.status,item.progressPercent,
   item.memberCount,new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"short"}).format(item.updatedAt),
  ]);
  const csv="\uFEFF"+[headings,...rows].map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const anchor=document.createElement("a");
  anchor.href=url;anchor.download="project-workspaces-page.csv";
  document.body.appendChild(anchor);anchor.click();anchor.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),0);
 }
 return <Button variant="secondary" size="sm" onClick={download} disabled={items.length===0}>
  Export this page
 </Button>;
}
