"use client";
import { Button } from "@/components/ui/button";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {TPO_QUICK_REPLIES,recruiterMessageDraftKey} from "@/modules/placements/tpo-message-draft-model";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
export function TpoRecruiterMessageReply({threadId,unread,actorUserId}:{
 threadId:string;unread:boolean;actorUserId:string;
}){
 const router=useRouter();
 const [body,setBody]=useState(""),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[success,setSuccess]=useState("");
 const draftKey=recruiterMessageDraftKey(actorUserId,threadId);
 const markedOnOpen=useRef<string|null>(null);
 const pending=useRef(false);
 const [discardReview,setDiscardReview]=useState(false);
 useEffect(()=>{
  if(!unread||markedOnOpen.current===threadId)return;
  markedOnOpen.current=threadId;
  void apiFetch("/api/placements/tpo/messages/threads/"+encodeURIComponent(threadId)+"/read",{
    method:"POST",credentials:"same-origin",timeoutMs:12000,
    headers:{"Content-Type":"application/json"},body:JSON.stringify({confirmed:true}),
  }).then(()=>router.refresh()).catch(reason=>{
    setError(reason instanceof Error?reason.message:friendlyApiError({network:true}));
  });
 },[threadId,unread,router]);

 useEffect(()=>{
  if(!body.trim())return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",warn);
  return ()=>window.removeEventListener("beforeunload",warn);
 },[body]);
 function persistDraft(value:string){
  setDiscardReview(false);setBody(value);
  try{if(value)sessionStorage.setItem(draftKey,value);else sessionStorage.removeItem(draftKey);}catch{/* Storage is optional. */}
 }
 function restoreDraft(){
  if(body)return;
  try{const saved=sessionStorage.getItem(draftKey);
   if(saved&&saved.length<=4000)setBody(saved);}catch{/* Storage is optional. */}
 }
 function discardDraft(){
  if(!body.trim())return;
  if(!discardReview){setDiscardReview(true);return;}
  persistDraft("");setDiscardReview(false);
 }
 async function post(mode:"messages"|"read"){
  if(pending.current||busy||(mode==="messages"&&!body.trim()))return;
  pending.current=true;setBusy(true);setError("");setSuccess("");
  try{
   await apiFetch("/api/placements/tpo/messages/threads/"+
    encodeURIComponent(threadId)+"/"+mode,{
     method:"POST",credentials:"same-origin",timeoutMs:15000,
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify(mode==="messages"?{body:body.trim()}:{confirmed:true}),
   });
   if(mode==="messages"){persistDraft("");setSuccess("Message sent");}
   else setSuccess("Messages marked read");
   router.refresh();
  }catch(reason){
   setError(reason instanceof Error?reason.message:friendlyApiError({network:true}));
  }finally{pending.current=false;setBusy(false);}
 }
 return <section className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 space-y-3" aria-label="Reply to recruiter">
  <h2 className="font-semibold text-foreground">Reply</h2>
  <div role="group" aria-label="Quick replies" className="flex flex-wrap gap-2">
    {TPO_QUICK_REPLIES.map(reply=><Button variant="secondary" key={reply} type="button" disabled={busy}
      className="min-h-11 px-3"
      onClick={()=>persistDraft(body?body+" "+reply:reply)}>{reply}</Button>)}
   </div>
  <form onSubmit={event=>{event.preventDefault();void post("messages");}} className="space-y-3">
   <label className="block text-sm text-body">Message
    <Textarea className="mt-1 min-h-28 w-full"
      maxLength={4000} required aria-label="Message" placeholder="Write a message" value={body}
      onFocus={restoreDraft} onChange={e=>persistDraft(e.target.value)}
      onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){
       e.preventDefault();if(body.trim()&&!busy)void post("messages");}}}/>
   </label>
   <p className="text-xs text-muted-foreground" aria-live="polite">Enter to send · Shift + Enter for a new line · {body.length}/4000</p>
   <div className="flex flex-wrap gap-2">
    <Button variant="secondary" type="button" disabled={busy||!body.trim()} onClick={discardDraft}
     className="min-h-11 px-4">Discard draft</Button>
    <Button variant="primary" type="submit" disabled={busy||!body.trim()}
     className="min-h-11 px-4">
      Send message
    </Button>
    {discardReview?<p role="status" className="w-full text-sm">Discard your unsent message? Select Discard draft again to confirm, or keep typing to cancel.</p>:null}
    {unread?<Button variant="secondary" type="button" disabled={busy} onClick={()=>void post("read")}
     className="min-h-11 px-4">
      Mark as read
    </Button>:null}
   </div>
  </form>
  {error?<p role="alert" className="text-sm text-body">{error}</p>:null}
  {success?<p role="status" className="text-sm text-body">{success}</p>:null}
 </section>;
}
