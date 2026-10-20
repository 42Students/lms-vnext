"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
export function SuperAdminPeopleCsvControl({href}:{href:string}) {
 const [pending,setPending]=useState(false);
 const [error,setError]=useState<string|null>(null);
 async function download(){
  if(pending)return;
  setPending(true);setError(null);
  try {
   const response=await fetch(href,{cache:"no-store"});
   if(!response.ok||!response.headers.get("Content-Type")?.startsWith("text/csv"))
    throw new Error("Export unavailable. Refresh filters or scope and retry.");
   const url=URL.createObjectURL(await response.blob());
   const link=document.createElement("a");
   link.href=url;link.download="super-admin-people-ist.csv";
   document.body.appendChild(link);
   try { link.click(); } finally { link.remove(); }
   window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  } catch(caught){setError(caught instanceof Error?caught.message:"Export failed.");}
  finally{setPending(false);}
 }
 return <div className="space-y-2 print:hidden">
  <Button type="button" size="md" variant="secondary" className="min-h-11 md:min-h-9" disabled={pending} onClick={()=>void download()}>
   {pending?"Preparing CSV…":"Export filtered CSV (max 500)"}
  </Button>
  <p className="text-xs text-muted-foreground">Names, roles and membership statuses only. No phone or email.</p>
  {error?<Alert tone="error">{error}</Alert>:null}
 </div>;
}
