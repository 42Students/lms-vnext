"use client";
import { Button } from "@/components/ui/button";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Textarea} from "@/components/ui/textarea";
import {Dialog} from "@/components/ui/dialog";
type Props={threadId:string;messageId:string;body:string;expectedBodyHash:string;canEdit:boolean};
export function TpoTeamMessageActions({threadId,messageId,body,expectedBodyHash,canEdit}:Props){
 const router=useRouter(),pending=useRef(false);
 const [mode,setMode]=useState<"EDIT"|"DELETE"|null>(null);
 const [draft,setDraft]=useState(body),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 async function submit(action:"EDIT"|"DELETE"){
  if(pending.current||action==="EDIT"&&(!draft.trim()||draft.trim().length>4000))return;
  pending.current=true;setBusy(true);setError("");
  try{
   await apiFetch("/api/placements/tpo/team/threads/"+encodeURIComponent(threadId)+
    "/messages/"+encodeURIComponent(messageId)+"/change",{
    method:"POST",credentials:"same-origin",timeoutMs:12000,
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action,expectedBodyHash,...(action==="EDIT"?{body:draft.trim()}:{})}),
   });
   setMode(null);router.refresh();
  }catch(reason){setError(reason instanceof Error?reason.message:"Could not save the message. Try again.");}
  finally{pending.current=false;setBusy(false);}
 }
 return <div className="mt-2 flex flex-wrap items-center gap-2">
  {canEdit?<Button variant="ghost" type="button" 
   onClick={()=>{setMode("EDIT");setError("");}}>Edit</Button>:null}
  <Button variant="ghost" type="button" 
   onClick={()=>{setMode("DELETE");setError("");}}>Delete</Button>
  {mode==="EDIT"?<form onSubmit={event=>{event.preventDefault();void submit("EDIT");}}
   className="w-full space-y-2">
   <label className="block text-xs">Edit message
    <Textarea value={draft} maxLength={4000} required rows={3} disabled={busy}
     onChange={event=>setDraft(event.target.value)} className="mt-1 w-full"/>
   </label>
   {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
   <Button variant="primary" type="submit" disabled={busy||!draft.trim()} >{busy?"Saving…":"Save edit"}</Button>
   <Button variant="ghost" type="button" disabled={busy} onClick={()=>setMode(null)} >Cancel</Button>
  </form>:null}
  {mode==="DELETE"?<div role="alertdialog" aria-modal="false" aria-label="Delete this message?"
   className="w-full space-y-2 border-t border-border pt-3 text-xs">
   <p>Delete this message? Other team members will see Message removed.</p>
   {error?<p role="alert" className="text-error">{error}</p>:null}
   <Button variant="danger" type="button" disabled={busy}
    onClick={()=>void submit("DELETE")}>{busy?"Removing…":"Delete message"}</Button>
   <Button variant="ghost" type="button" disabled={busy} onClick={()=>setMode(null)} >Cancel</Button>
  </div>:null}
 </div>;
}
