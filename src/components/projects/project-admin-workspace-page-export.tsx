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
 return <Button variant="secondary" onClick={download} disabled={items.length===0}>
  Export this page
 </Button>;
}
