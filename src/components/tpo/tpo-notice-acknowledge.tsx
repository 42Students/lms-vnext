"use client";
import { Button } from "@/components/ui/button";
import {useState} from "react";
export function TpoNoticeAcknowledge({id}:{id:string}){
 const [read,setRead]=useState(false),[busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 return <div className="mt-3 space-y-1">
  <Button variant="secondary" type="button" disabled={read||busy}
   className="min-h-11 sm:min-h-9 text-sm"
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
   }}>{busy?"Saving…":read?"Read confirmed":"Mark notice read"}</Button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </div>;
}
