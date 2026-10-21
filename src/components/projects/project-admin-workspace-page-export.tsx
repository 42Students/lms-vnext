"use client";
import {Button} from "@/components/ui/button";
import type {ProjectAdminWorkspaceListItem} from "./project-admin-workspace-list";
import {projectWorkspacePageCsv} from "@/modules/projects/admin-workspace-page-export-model";
/** COL-projects-08: only the already authorized visible page, never all tenant rows. */
export function ProjectAdminWorkspacePageExport({items}:{items:readonly ProjectAdminWorkspaceListItem[]}){
 function download(){
  const csv=projectWorkspacePageCsv(items);
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const anchor=document.createElement("a");
  anchor.href=url;anchor.download="project-workspaces-page.csv";
  document.body.appendChild(anchor);anchor.click();anchor.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),0);
 }
 return <Button variant="secondary" onClick={download} disabled={items.length===0}
  aria-label="Export this page as CSV">
  <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"
   fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
   strokeLinejoin="round" className="mr-2 inline-block shrink-0">
   <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 16v4h16v-4"/>
  </svg>
  Export this page
 </Button>;
}
