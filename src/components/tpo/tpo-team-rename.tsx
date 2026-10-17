"use client";
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
  <button type="button" className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold"
   onClick={()=>setOpen(value=>!value)} aria-expanded={open}>Rename conversation</button>
  {open?<form onSubmit={event=>void save(event)} className="space-y-3 rounded-lg border border-border p-3">
   <label className="grid gap-2 text-sm font-semibold">Conversation name
    <input required maxLength={200} value={topic} onChange={event=>setTopic(event.target.value)}
     disabled={busy} className="min-h-11 rounded-md border border-border bg-surface px-3"/>
   </label>
   {error?<p role="alert" className="text-sm text-danger">{error}</p>:null}
   <div className="flex gap-2">
    <button type="submit" disabled={busy||!topic.trim()}
     className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
     {busy?"Saving…":"Save"}</button>
    <button type="button" disabled={busy} className="min-h-11 rounded-md border border-border px-4"
     onClick={()=>{setOpen(false);setTopic(currentTopic);setError("");}}>Cancel</button>
   </div>
  </form>:null}
 </div>;
}
