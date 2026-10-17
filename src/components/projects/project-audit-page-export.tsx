"use client";
type Row={id:string;action:string;summary:string;entity:string;importance:string;occurredAt:string};
function escape(value:string){return '"'+value.replaceAll('"','""')+'"';}
export function ProjectAuditPageExport({rows}:{rows:Row[]}){
 function save(){
  const header=["Event ID","Action","Entity","Summary","Importance","Occurred at"];
  const data=rows.map(r=>[r.id,r.action,r.entity,r.summary,r.importance,r.occurredAt]);
  const contents="\ufeff"+[header,...data].map(row=>row.map(escape).join(",")).join("\r\n");
  const file=new Blob([contents],{type:"text/csv;charset=utf-8"});
  const link=document.createElement("a"),url=URL.createObjectURL(file);
  link.href=url;link.download="project-audit-log.csv";link.click();URL.revokeObjectURL(url);
 }
 return <button type="button" disabled={!rows.length} onClick={save}
   className="min-h-10 rounded border border-border px-3 text-sm font-semibold disabled:opacity-50">
   Export shown audit groups · CSV
 </button>;
}
