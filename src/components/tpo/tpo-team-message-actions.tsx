"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
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
  {canEdit?<button type="button" className="min-h-10 text-xs font-semibold underline"
   onClick={()=>{setMode("EDIT");setError("");}}>Edit</button>:null}
  <button type="button" className="min-h-10 text-xs font-semibold underline"
   onClick={()=>{setMode("DELETE");setError("");}}>Delete</button>
  {mode==="EDIT"?<form onSubmit={event=>{event.preventDefault();void submit("EDIT");}}
   className="w-full space-y-2">
   <label className="block text-xs">Edit message
    <textarea value={draft} maxLength={4000} required rows={3} disabled={busy}
     onChange={event=>setDraft(event.target.value)} className="mt-1 w-full rounded border border-border bg-surface p-2"/>
   </label>
   {error?<p role="alert" className="text-xs text-danger">{error}</p>:null}
   <button type="submit" disabled={busy||!draft.trim()} className="min-h-10 rounded bg-primary px-3 text-xs text-on-primary">{busy?"Saving…":"Save edit"}</button>
   <button type="button" disabled={busy} onClick={()=>setMode(null)} className="ml-2 min-h-10 text-xs underline">Cancel</button>
  </form>:null}
  {mode==="DELETE"?<div role="alertdialog" aria-modal="false" aria-label="Delete this message?"
   className="w-full space-y-2 rounded border border-border p-3 text-xs">
   <p>Delete this message? Other team members will see Message removed.</p>
   {error?<p role="alert" className="text-danger">{error}</p>:null}
   <button type="button" disabled={busy} className="min-h-10 rounded bg-primary px-3 text-on-primary"
    onClick={()=>void submit("DELETE")}>{busy?"Removing…":"Delete message"}</button>
   <button type="button" disabled={busy} onClick={()=>setMode(null)} className="ml-2 min-h-10 underline">Cancel</button>
  </div>:null}
 </div>;
}
