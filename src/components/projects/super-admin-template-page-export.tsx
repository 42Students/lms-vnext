"use client";
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
 return <button type="button" disabled={!items.length} onClick={exportCsv}
  className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold disabled:opacity-50">
  Export templates · CSV
 </button>;
}
