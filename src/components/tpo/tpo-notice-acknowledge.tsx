"use client";
import {useState} from "react";
export function TpoNoticeAcknowledge({id}:{id:string}){
 const [read,setRead]=useState(false),[busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 return <div className="mt-3 space-y-1">
  <button type="button" disabled={read||busy}
   className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-60"
   onClick={async()=>{
    setBusy(true);setError("");
    try{
     const response=await fetch("/api/placements/notices/"+encodeURIComponent(id)+"/read",{
      method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
     });
     if(!response.ok)throw new Error("Read status couldn't be saved");
     const result=await response.json() as {read:boolean};
     if(result.read)setRead(true);else setError("No delivered notification is available to acknowledge yet.");
    }catch(e){setError(e instanceof Error?e.message:"Read status couldn't be saved");}
    finally{setBusy(false);}
   }}>{busy?"Saving…":read?"Read confirmed":"Mark notice read"}</button>
  {error?<p role="alert" className="text-sm">{error}</p>:null}
 </div>;
}
