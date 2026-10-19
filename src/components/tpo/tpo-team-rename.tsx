"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
export function TpoTeamRename({threadId,currentTopic}:{threadId:string;currentTopic:string}){
 const router=useRouter();
 const busyRef=useRef(false);
 const [open,setOpen]=useState(false),[topic,setTopic]=useState(currentTopic);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function save(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busyRef.current||!topic.trim()||topic.trim().length>200)return;
  busyRef.current=true;setBusy(true);setError("");
  try{
   await apiFetch("/api/placements/tpo/team/threads/"+encodeURIComponent(threadId)+"/rename",{
    method:"POST",credentials:"same-origin",timeoutMs:12000,
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({topic:topic.trim(),expectedTopic:currentTopic}),
   });
   setOpen(false);router.refresh();
  }catch(reason){
   setError(reason instanceof Error?reason.message:"Could not rename the conversation. Try again.");
  }finally{busyRef.current=false;setBusy(false);}
 }
 return <div className="space-y-2">
  <Button type="button" variant="secondary" className="min-h-11 sm:min-h-9"
   onClick={()=>setOpen(value=>!value)} aria-expanded={open}>Rename conversation</Button>
  {open?<form onSubmit={event=>void save(event)} className="space-y-3 border-t border-border pt-3">
   <label className="grid gap-2 text-sm font-semibold">Conversation name
    <Input required maxLength={200} value={topic} onChange={event=>setTopic(event.target.value)}
     disabled={busy} className="min-h-11 sm:min-h-9"/>
   </label>
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
   <div className="flex gap-2">
    <Button type="submit" disabled={busy||!topic.trim()}
     className="min-h-11 sm:min-h-9">
     {busy?"Saving…":"Save"}</Button>
    <Button type="button" variant="secondary" disabled={busy} className="min-h-11 sm:min-h-9"
     onClick={()=>{setOpen(false);setTopic(currentTopic);setError("");}}>Cancel</Button>
   </div>
  </form>:null}
 </div>;
}
