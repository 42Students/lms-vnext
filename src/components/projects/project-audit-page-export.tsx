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
   className="">
   <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mr-2 inline-block shrink-0"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" /></svg>
   Export CSV
 </Button>;
}
