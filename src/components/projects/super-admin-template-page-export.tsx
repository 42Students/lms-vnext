"use client";
import { Button } from "@/components/ui/button";
import {projectAdminCsv} from "@/modules/projects/project-admin-csv-model";
type Template={title:string;slug:string;summary:string|null;currentVersion:number;status:string};
export function SuperAdminTemplatePageExport({items}:{items:Template[]}){
 function exportCsv(){
  const rows=[["Title","Slug","Version","Lifecycle","Summary"],
   ...items.map(t=>[t.title,t.slug,String(t.currentVersion),t.status,t.summary??""])];
  const contents=projectAdminCsv(rows);
  const blob=new Blob([contents],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");
  a.href=url;a.download="project-templates-page.csv";a.click();URL.revokeObjectURL(url);
 }
 return <Button variant="secondary" type="button" disabled={!items.length} onClick={exportCsv}
  className="min-h-11 md:min-h-9">
  Export this page · CSV
 </Button>;
}
