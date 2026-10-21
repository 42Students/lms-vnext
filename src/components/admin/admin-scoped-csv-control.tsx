"use client";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import type {SuperAdminReadRow} from "@/modules/admin-ui/super-admin-read-directory-model";
export function AdminScopedCsvControl({href,filename,visibleFacultyRows}:{
 href:string;filename:string;visibleFacultyRows?:readonly SuperAdminReadRow[];
}){
 const [pending,setPending]=useState(false);
 const [error,setError]=useState<string|null>(null);
 /** Legacy six-column roster exports authorized visible rows only.
  * The separate server export keeps its full-matching 250-row cap. */
 function csvCell(value:string){
  const safe=/^[\s\p{Cc}\p{Cf}\p{Mn}\p{Me}]*[=+@-]/u.test(value)?"'"+value:value;
  return '"'+safe.replaceAll('"','""')+'"';
 }
 function visibleFacultyCsv(){
  if(!visibleFacultyRows)return null;
  const columns=["Name","Mobile","Email","Type","Gender","Status"];
  const value=(row:SuperAdminReadRow,key:string)=>
    row.details.find(detail=>detail.startsWith(key+": "))?.slice(key.length+2)??"";
  const rows=[columns.map(csvCell).join(",")];
  for(const row of visibleFacultyRows){
   rows.push([
    row.title,value(row,"Mobile"),value(row,"Email"),
    value(row,"Faculty type")||value(row,"Type")||value(row,"Employment type"),
    value(row,"Gender"),row.status==="ACTIVE"?"Enabled":row.status==="SUSPENDED"?"Suspended":row.status,
   ].map(csvCell).join(","));
  }
  return "\uFEFF"+rows.join("\r\n")+"\r\n";
 }
 function downloadVisible(){
  if(pending||!visibleFacultyRows?.length)return;
  const csv=visibleFacultyCsv();
  if(csv===null)return;
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download="faculty.csv";
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 async function download(){
  if(pending)return;
  setPending(true);setError(null);
  try{
   const response=await fetch(href,{cache:"no-store"});
   if(!response.ok||!response.headers.get("Content-Type")?.startsWith("text/csv"))
    throw new Error("Export unavailable. Refresh your selected college and filters, then retry.");
   const blob=await response.blob();
   const url=URL.createObjectURL(blob),anchor=document.createElement("a");
   anchor.href=url;anchor.download=filename;document.body.appendChild(anchor);anchor.click();anchor.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(caught){setError(caught instanceof Error?caught.message:"Unable to export this directory.");}
  finally{setPending(false);}
 }
 return <div className="space-y-2 print:hidden"><Button type="button" size="sm" variant="secondary" className="min-h-11 md:min-h-9" disabled={pending} onClick={()=>void download()}>
  {pending?"Preparing CSV…":"Export matching CSV (max 250)"}</Button>
  {visibleFacultyRows?<Button type="button" size="sm" variant="secondary"
    disabled={pending||visibleFacultyRows.length===0} onClick={downloadVisible}
    className="ml-2 min-h-11 md:min-h-9">
    Export visible faculty.csv ({visibleFacultyRows.length} rows)
   </Button>:null}
  {error?<p role="alert" className="max-w-sm text-sm text-error">{error}</p>:null}
 </div>;
}
