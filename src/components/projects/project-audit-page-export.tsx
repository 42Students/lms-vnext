"use client";
import { Button } from "@/components/ui/button";
import { projectAdminCsv } from "@/modules/projects/project-admin-csv-model";
type Row={id:string;action:string;summary:string;entity:string;importance:string;occurredAt:string};
export function ProjectAuditPageExport({rows}:{rows:Row[]}){
 function save(){
  const header=["Event ID","Action","Entity","Summary","Importance","Occurred at"];
  const data=rows.map(r=>[r.id,r.action,r.entity,r.summary,r.importance,r.occurredAt]);
  const contents=projectAdminCsv([header,...data]);
  const file=new Blob([contents],{type:"text/csv;charset=utf-8"});
  const link=document.createElement("a"),url=URL.createObjectURL(file);
  link.href=url;link.download="project-audit-log.csv";link.click();URL.revokeObjectURL(url);
 }
 return <Button variant="secondary" type="button" disabled={!rows.length} onClick={save}
   className="">
   Export shown audit groups · CSV
 </Button>;
}
