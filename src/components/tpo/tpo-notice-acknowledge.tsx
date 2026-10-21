"use client";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useCallback,useEffect,useRef,useState} from "react";
/** Legacy placement-cell notices became read on opening. Keep a scoped POST
 * rather than making a read-only GET mutate state; automatic failures retain
 * an explicit accessible retry, so transient errors never consume the badge. */
export function TpoNoticeAcknowledge({id}:{id:string}){
 const attempted=useRef(false);
 const busyRef=useRef(false);
 const [read,setRead]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const mark=useCallback(async()=>{
  if(busyRef.current)return;
  busyRef.current=true;setBusy(true);setError("");
  try{
   const response=await fetch("/api/placements/notices/"+encodeURIComponent(id)+"/read",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},
   });
   if(!response.ok)throw new Error("Read status couldn't be saved");
   const raw:unknown=await response.json().catch(()=>null);
   if(!raw||typeof raw!=="object"||!("read" in raw)||raw.read!==true)
    throw new Error("Notice acknowledgement could not be confirmed.");
   setRead(true);
  }catch{
   setError("Notice still unread. Retry marking this notice read.");
  }finally{busyRef.current=false;setBusy(false);}
 },[id]);
 useEffect(()=>{if(attempted.current)return;attempted.current=true;void mark();},[mark]);
 if(read||(!error&&busy))return null;
 return <div className="mt-3 space-y-1">
  {error?<InlineNotice tone="error" message={error}/>:null}
  <Button variant="secondary" type="button" disabled={busy} onClick={()=>void mark()}
   className="min-h-11 text-sm md:min-h-9">{busy?"Saving…":"Retry marking read"}</Button>
 </div>;
}
