"use client";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import {useState} from "react";
export function TpoNoticeAcknowledge({id}:{id:string}){
 const [read,setRead]=useState(false),[busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 // Reading is silent in the old LMS; successful acknowledgement disappears
 // instead of becoming a new "Read confirmed" success button.
 if(read)return null;
 return <div className="mt-3 space-y-1">
  <Button variant="secondary" type="button" disabled={read||busy}
   className="min-h-11 min-[768px]:min-h-9 text-sm"
   onClick={async()=>{
    setBusy(true);setError("");
    try{
     const response=await fetch("/api/placements/notices/"+encodeURIComponent(id)+"/read",{
      method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
     });
     if(!response.ok)throw new Error("Read status couldn't be saved");
     const result=await response.json() as {read:boolean};
     if(result.read)setRead(true);else setError("This notice is not available to mark read yet.");
    }catch(e){setError(e instanceof Error?e.message:"Read status couldn't be saved");}
    finally{setBusy(false);}
   }}>{busy?"Saving…":"Mark notice read"}</Button>
  {error?<InlineNotice tone="error" message={error}/>:null}
 </div>;
}
