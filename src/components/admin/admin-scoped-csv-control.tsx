"use client";
import {useState} from "react";
import {Button} from "@/components/ui/button";
export function AdminScopedCsvControl({href,filename}:{href:string;filename:string}){
 const [pending,setPending]=useState(false);
 const [error,setError]=useState<string|null>(null);
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
  {error?<p role="alert" className="max-w-sm text-sm text-error">{error}</p>:null}
 </div>;
}
