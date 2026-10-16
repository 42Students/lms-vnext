"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function RecruiterDecisionReadButton({id}:{id:string}){
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function read(){
  if(busy)return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/notifications/"+encodeURIComponent(id)+"/read",{
    method:"POST",credentials:"same-origin",
   });
   if(!response.ok){setError("Could not mark read. Please retry.");return;}
   router.refresh();
  }catch{setError("Could not mark read. Check your connection.");}
  finally{setBusy(false);}
 }
 return <div className="mt-2">
  <button type="button" disabled={busy} onClick={()=>void read()}
   className="min-h-10 rounded-md border border-border px-3 text-sm text-primary-text">
   {busy?"Saving…":"Mark as read"}
  </button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </div>;
}
