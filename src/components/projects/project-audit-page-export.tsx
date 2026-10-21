"use client";
import { Button } from "@/components/ui/button";
import { projectAdminCsv } from "@/modules/projects/project-admin-csv-model";
type Row={id:string;action:string;summary:string;entity:string;importance:string;occurredAt:string;
 actorName?:string|null;entityType?:string|null;entityId?:string|null};
export function ProjectAuditPageExport({rows}:{rows:Row[]}){
 function save(){
  const header=["Action","Entity type","Entity ID","Actor","When"];
  // Rows are the ungrouped authorized event set supplied by the audit page;
  // never replace an unknown actor or entity ID with an unrelated event UUID.
  const data=rows.map(r=>[r.action,r.entityType??"",r.entityId??"",r.actorName??"",r.occurredAt]);
  const contents=projectAdminCsv([header,...data]);
  const file=new Blob([contents],{type:"text/csv;charset=utf-8"});
  const link=document.createElement("a"),url=URL.createObjectURL(file);
  link.href=url;link.download="project-audit-log.csv";link.click();URL.revokeObjectURL(url);
 }
 return <Button variant="secondary" type="button" disabled={!rows.length} onClick={save}
   title="Export the audit events currently loaded (not the full history)"
   className="">
   <span aria-hidden="true">↓</span> Export CSV
 </Button>;
}
