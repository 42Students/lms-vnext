"use client";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { InlineNotice } from "@/components/ui/inline-notice";
import {useEffect,useId,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {TPO_QUICK_REPLIES,recruiterMessageDraftKey} from "@/modules/placements/tpo-message-draft-model";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {Textarea} from "@/components/ui/textarea";
export function TpoRecruiterMessageReply({threadId,unread,actorUserId,accessEnded=false,quote}:{
 threadId:string;unread:boolean;actorUserId:string;accessEnded?:boolean;quote?:string;
}){
 const router=useRouter();
 const draftHintId=useId();
 const textareaRef=useRef<HTMLTextAreaElement>(null);
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
 function addQuickReply(value:string){
  const text=body?body+" "+value:value;
  if(text.length>4000){
   setError("Message must be 4000 characters or fewer.");
   return;
  }
  setError("");
  persistDraft(text);
  textareaRef.current?.focus();
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
  if(pending.current||busy||(mode==="messages"&&(!body.trim()||accessEnded)))return;
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
 return <section className="space-y-3 border-t border-border pt-4" aria-label="Reply to recruiter">
  {accessEnded?<p role="status" className="text-sm text-warning">Recruiter access ended. Sending is unavailable until access is restored.</p>:null}
  <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">Reply</h2>
  {quote?<Button type="button" variant="secondary" disabled={busy||accessEnded}
    className="min-h-11 md:min-h-9" onClick={()=>addQuickReply(quote)}>Quote change request</Button>:null}
  <Disclosure title="Quick replies" className="min-w-0" contentClassName="pt-2">
  <div role="group" aria-label="Quick replies" className="flex min-w-0 flex-wrap gap-2">
    {TPO_QUICK_REPLIES.map(reply=><Button variant="secondary" key={reply} type="button" disabled={busy||accessEnded}
      className="min-h-11 md:min-h-9 shrink-0 rounded-[var(--lms-control-radius)] px-3 text-sm font-[650]"
      onClick={()=>addQuickReply(reply)}>{reply}</Button>)}
   </div>
  </Disclosure>
  <form aria-busy={busy} onSubmit={event=>{event.preventDefault();void post("messages");}} className="space-y-3">
   <label className="block text-[13px] text-[var(--lms-neutral-400)] font-semibold leading-4">Message
    <Textarea ref={textareaRef} aria-describedby={draftHintId} className="mt-1 min-h-28 w-full"
      maxLength={4000} required disabled={accessEnded} aria-label="Message" placeholder="Write a message" value={body}
      onFocus={restoreDraft} onChange={e=>persistDraft(e.target.value)}
      onKeyDown={e=>{if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)&&!e.nativeEvent.isComposing){
       e.preventDefault();if(body.trim()&&!busy&&!accessEnded)void post("messages");}}}/>
   </label>
   <p id={draftHintId} className="text-xs text-muted-foreground leading-[20px]" aria-live="polite">Ctrl/Cmd + Enter to send · Enter for a new line · {body.length}/4000</p>
   <div className="flex min-w-0 flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center">
    <Button variant="secondary" type="button" disabled={busy||accessEnded||!body.trim()} onClick={discardDraft}
     className="min-h-11 w-full px-4 sm:w-auto md:min-h-9">Discard draft</Button>
    <Button variant="primary" type="submit" disabled={busy||accessEnded||!body.trim()}
     className="min-h-11 w-full px-4 sm:w-auto md:min-h-9">
      Send message
    </Button>
    {discardReview?<p role="status" className="w-full text-sm leading-[22px]">Discard your unsent message? Select Discard draft again to confirm, or keep typing to cancel.</p>:null}
    {unread?<Button variant="secondary" type="button" disabled={busy} onClick={()=>void post("read")}
     className="min-h-11 w-full px-4 sm:w-auto md:min-h-9">
      Mark as read
    </Button>:null}
   </div>
  </form>
  {error?<InlineNotice tone="error" role="alert" message={error}/>:null}
  {success?<InlineNotice tone="success" message={success}/>:null}
 </section>;
}
