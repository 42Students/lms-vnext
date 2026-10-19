"use client";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";

import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";

export function TpoEveryoneControls({muted,actorUserId}:{muted:boolean;actorUserId:string}){
 const router=useRouter();
 const pending=useRef(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [success,setSuccess]=useState("");
 const [localMuted,setLocalMuted]=useState(muted);
 const draftKey="tpo-everyone-message:"+actorUserId;
 useEffect(()=>{
  const task=window.setTimeout(()=>{
   try{
    const previous=sessionStorage.getItem(draftKey);
    if(previous&&previous.length<=4000)setMessage(previous);
   }catch{/* Storage is optional. */}
  },0);
  return ()=>window.clearTimeout(task);
 },[draftKey]);
 useEffect(()=>{
  if(!message.trim())return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",warn);
  return ()=>window.removeEventListener("beforeunload",warn);
 },[message]);
 function updateMessage(next:string){
  setMessage(next);
  try{
   if(next)sessionStorage.setItem(draftKey,next);
   else sessionStorage.removeItem(draftKey);
  }catch{/* Storage is optional. */}
 }
 async function post(){
  if(pending.current||!message.trim())return;
  pending.current=true;setBusy(true);setError("");setSuccess("");
  try{
   const form=new FormData();
   form.set("body",message.trim());
   await apiFetch<{id:string}>("/api/placements/tpo/team/everyone/messages",{
    method:"POST",credentials:"same-origin",headers:{Accept:"application/json"},
    body:form,timeoutMs:30000,
   });
   updateMessage("");setSuccess("Message sent to Everyone.");router.refresh();
  }catch(reason){
   setError(reason instanceof Error?reason.message:friendlyApiError({network:true}));
  }finally{pending.current=false;setBusy(false);}
 }
 async function updateMute(){
  if(pending.current)return;
  pending.current=true;setBusy(true);setError("");
  try{
   const form=new FormData();
   form.set("muted",localMuted?"false":"true");
   const reply=await apiFetch<{muted:boolean}>("/api/placements/tpo/team/everyone/mute",{
    method:"POST",credentials:"same-origin",headers:{Accept:"application/json"},
    body:form,timeoutMs:30000,
   });
   setLocalMuted(reply.muted);router.refresh();
  }catch(reason){
   setError(reason instanceof Error?reason.message:friendlyApiError({network:true}));
  }finally{pending.current=false;setBusy(false);}
 }
 return <div className="space-y-3">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <p className="text-xs text-muted-foreground">
    {localMuted?"Muted: no unread count, no noise":"Everyone in the team can read and reply."}
   </p>
   <Button variant="secondary" type="button" disabled={busy} onClick={()=>void updateMute()}
    >
    {busy?"Updating…":localMuted?"Unmute":"Mute"}
   </Button>
  </div>
  <form onSubmit={event=>{event.preventDefault();void post();}}
   className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
   <h2 className="font-semibold">Write to Everyone</h2>
   <label className="block text-sm">Message
    <Textarea className="mt-2" name="body" required maxLength={4000} rows={4} value={message}
     onChange={event=>updateMessage(event.target.value)} disabled={busy}
     
     placeholder="Share an update with the placement team"/>
   </label>
   <p aria-live="polite" className="text-xs text-muted-foreground">{message.length}/4000</p>
   <Button type="submit" disabled={busy||!message.trim()}
    >
    {busy?"Sending…":"Send to Everyone"}
   </Button>
  </form>
  {success?<p role="status" className="text-sm text-body">{success}</p>:null}
  {error?<p role="alert" className="text-sm text-danger">{error}</p>:null}
 </div>;
}
