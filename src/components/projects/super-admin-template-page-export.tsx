"use client";
type Template={title:string;slug:string;summary:string|null;currentVersion:number;status:string};
function csv(value:unknown){return '"'+String(value??"").replaceAll('"','""')+'"';}
export function SuperAdminTemplatePageExport({items}:{items:Template[]}){
 function exportCsv(){
  const rows=[["Title","Slug","Version","Lifecycle","Summary"],
   ...items.map(t=>[t.title,t.slug,String(t.currentVersion),t.status,t.summary??""])];
  const contents="\ufeff"+rows.map(r=>r.map(csv).join(",")).join("\r\n");
  const blob=new Blob([contents],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");
  a.href=url;a.download="project-templates-page.csv";a.click();URL.revokeObjectURL(url);
 }
 return <button type="button" disabled={!items.length} onClick={exportCsv}
  className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold disabled:opacity-50">
  Export templates · CSV
 </button>;
}
