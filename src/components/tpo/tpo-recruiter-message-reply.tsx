"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {TPO_QUICK_REPLIES,recruiterMessageDraftKey} from "@/modules/placements/tpo-message-draft-model";
export function TpoRecruiterMessageReply({threadId,unread,actorUserId}:{
 threadId:string;unread:boolean;actorUserId:string;
}){
 const router=useRouter();
 const [body,setBody]=useState(""),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[success,setSuccess]=useState("");
 const draftKey=recruiterMessageDraftKey(actorUserId,threadId);
 const markedOnOpen=useRef<string|null>(null);
 useEffect(()=>{
  if(!unread||markedOnOpen.current===threadId)return;
  markedOnOpen.current=threadId;
  void fetch("/api/placements/tpo/messages/threads/"+encodeURIComponent(threadId)+"/read",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({confirmed:true}),
  }).then(response=>{
    if(!response.ok)throw new Error("Could not mark this conversation read.");
    router.refresh();
  }).catch(()=>{setError("Messages could not be marked read. Use Mark as read to retry.");});
 },[threadId,unread,router]);

 useEffect(()=>{
  if(!body.trim())return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",warn);
  return ()=>window.removeEventListener("beforeunload",warn);
 },[body]);
 function persistDraft(value:string){
  setBody(value);
  try{if(value)sessionStorage.setItem(draftKey,value);else sessionStorage.removeItem(draftKey);}catch{/* Storage is optional. */}
 }
 function restoreDraft(){
  if(body)return;
  try{const saved=sessionStorage.getItem(draftKey);
   if(saved&&saved.length<=4000)setBody(saved);}catch{/* Storage is optional. */}
 }
 function discardDraft(){
  if(!body.trim()||window.confirm("Discard draft?"))persistDraft("");
 }
 async function post(mode:"messages"|"read"){
  setBusy(true);setError("");setSuccess("");
  try{
   const response=await fetch("/api/placements/tpo/messages/threads/"+
     encodeURIComponent(threadId)+"/"+mode,{
     method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
     body:JSON.stringify(mode==="messages"?{body}:{confirmed:true}),
   });
   if(!response.ok){
    const payload=await response.json() as {error?:string};
    throw new Error(response.status===403?"You do not have permission to write in this conversation.":
     payload.error==="THREAD_NOT_FOUND"?"This conversation is no longer available.":
     "Couldn't save. Please try again.");
   }
   if(mode==="messages"){persistDraft("");setSuccess("Message sent");}
   else setSuccess("Messages marked read");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Couldn't save. Please try again.");}
  finally{setBusy(false);}
 }
 return <section className="rounded-xl border border-border bg-surface p-5 space-y-3" aria-label="Reply to recruiter">
  <h2 className="font-semibold text-foreground">Reply</h2>
  <div role="group" aria-label="Quick replies" className="flex flex-wrap gap-2">
    {TPO_QUICK_REPLIES.map(reply=><button key={reply} type="button" disabled={busy}
      className="min-h-10 rounded-md border border-border px-3 text-sm text-body"
      onClick={()=>persistDraft(body?body+" "+reply:reply)}>{reply}</button>)}
   </div>
  <form onSubmit={event=>{event.preventDefault();void post("messages");}} className="space-y-3">
   <label className="block text-sm text-body">Message
    <textarea className="mt-1 min-h-28 w-full rounded-md border border-border bg-surface p-3 text-foreground"
      maxLength={4000} required aria-label="Message" placeholder="Write a message" value={body}
      onFocus={restoreDraft} onChange={e=>persistDraft(e.target.value)}
      onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){
       e.preventDefault();if(body.trim()&&!busy)void post("messages");}}}/>
   </label>
   <p className="text-xs text-muted-foreground" aria-live="polite">Enter to send · Shift + Enter for a new line · {body.length}/4000</p>
   <div className="flex flex-wrap gap-2">
    <button type="button" disabled={busy||!body.trim()} onClick={discardDraft}
     className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold">Discard draft</button>
    <button type="submit" disabled={busy||!body.trim()}
     className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
      Send message
    </button>
    {unread?<button type="button" disabled={busy} onClick={()=>void post("read")}
     className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-50">
      Mark as read
    </button>:null}
   </div>
  </form>
  {error?<p role="alert" className="text-sm text-body">{error}</p>:null}
  {success?<p role="status" className="text-sm text-body">{success}</p>:null}
 </section>;
}
