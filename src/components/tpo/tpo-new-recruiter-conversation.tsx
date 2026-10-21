"use client";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Disclosure } from "@/components/ui/disclosure";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {useEffect,useId,useRef,useState} from "react";
import {Dialog} from "@/components/ui/dialog";
import {useRouter} from "next/navigation";
import {useToast} from "@/components/ui/toast";
import {TPO_QUICK_REPLIES} from "@/modules/placements/tpo-message-draft-model";

type Recruiter={userId:string;displayName:string|null;companyName:string};
export function TpoNewRecruiterConversation({recruiters,actorUserId}:{
 recruiters:Recruiter[];actorUserId:string;
}){
 const router=useRouter();
 const {showToast}=useToast();
 const formId=useId();
 const [open,setOpen]=useState(false),[id,setId]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [createdThreadId,setCreatedThreadId]=useState<string|null>(null);
 const selectRef=useRef<HTMLSelectElement>(null);
 const launchRef=useRef<HTMLButtonElement>(null);
 const inFlightRef=useRef(false);
 const draftKey="tpo-new-recruiter-message:"+actorUserId;

 function editMessage(value:string){
  setMessage(value);setError("");
  try{if(value)sessionStorage.setItem(draftKey,value);else sessionStorage.removeItem(draftKey);}
  catch{/* Private browsing may disable storage. */}
 }
 function close(){
  if(busy)return;
  setOpen(false);setError("");
  launchRef.current?.focus();
 }
 function openDialog(){
  setOpen(true);setError("");
  try{const draft=sessionStorage.getItem(draftKey);if(draft&&draft.length<=4000)setMessage(draft);}
  catch{/* Session storage is optional. */}
 }
 useEffect(()=>{if(open)selectRef.current?.focus();},[open]);
 useEffect(()=>{
  if(!open||!message.trim())return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",warn);
  return ()=>window.removeEventListener("beforeunload",warn);
 },[open,message]);

 async function create(){
  if(!id||!message.trim()||message.trim().length>4000||busy||inFlightRef.current)return;
  inFlightRef.current=true;
  setBusy(true);setError("");
  try{
   let threadId=createdThreadId;
   if(!threadId){
    const res=await fetch("/api/placements/tpo/messages/threads",{
     method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({recruiterUserId:id}),
    });
    if(!res.ok)throw new Error(res.status===403?"You do not have permission to start this conversation.":
      "This recruiter no longer has active placement access. Please refresh.");
    const result=await res.json() as {threadId:string};
    threadId=result.threadId;
    setCreatedThreadId(threadId);
   }
   const sent=await fetch("/api/placements/tpo/messages/threads/"+encodeURIComponent(threadId)+"/messages",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({body:message.trim()}),
   });
   if(!sent.ok){
    showToast({tone:"error",title:"Failed to send",
      description:"Conversation opened, but the message was not sent. Retry or open the conversation."});
    throw new Error("Conversation opened, but the message was not sent. Retry or open the conversation.");
   }
   editMessage("");
   showToast({tone:"success",title:"Message sent"});
   router.push("/tpo/messages/"+encodeURIComponent(threadId));
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Couldn't start conversation.");}
  finally{inFlightRef.current=false;setBusy(false);}
 }
 return <div>
  <Button variant="primary" ref={launchRef} type="button" className="min-h-11 w-full rounded-[var(--lms-control-radius)] px-4 text-sm font-[650] sm:w-auto md:min-h-9"
   onClick={()=>open?close():openDialog()}>New message</Button>
  <Dialog open={open} onOpenChange={next=>{if(!next)close();}} dismissible={!busy}
   title="New message to a recruiter"
   footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
     <Button variant="secondary" type="button" onClick={()=>editMessage("")} disabled={!message||busy}
       className="min-h-11 w-full sm:w-auto md:min-h-9">Discard draft</Button>
     <Button variant="primary" type="submit" form={formId} disabled={!id||!message.trim()||busy} loading={busy}
       className="min-h-11 w-full sm:w-auto md:min-h-9">{busy?"Sending…":"Send"}</Button>
   </div>}>
    <form id={formId} onSubmit={event=>{event.preventDefault();void create();}} className="space-y-3">
     <label className="block text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Recruiter
      <Select ref={selectRef} aria-label="Recruiter" required value={id}
       onChange={e=>{setId(e.target.value);setCreatedThreadId(null);setError("");}} disabled={busy}
       className="mt-1 min-h-11 w-full border px-2">
       <option value="">Choose a recruiter</option>
       {recruiters.map(r=><option key={r.userId} value={r.userId}>
        {(r.displayName?.trim()||"Unnamed recruiter")+" · "+r.companyName}
       </option>)}
      </Select>
     </label>
     {recruiters.length===0?<InlineNotice tone="info" message="No recruiters have verified, active placement access."/>:null}
     <Disclosure title="Quick replies" className="border-t border-border" contentClassName="px-2 pb-2">
      <div role="group" aria-label="Quick replies" className="flex flex-wrap gap-2">
      {TPO_QUICK_REPLIES.map(reply=><Button variant="secondary" key={reply} type="button" disabled={busy||(message?message.length+1+reply.length:reply.length)>4000}
       onClick={()=>editMessage(message?message+" "+reply:reply)}
       className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-[650]">{reply}</Button>)}
      </div>
     </Disclosure>
     <label className="block text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Message
      <Textarea aria-label="New message" placeholder="Write a message" required maxLength={4000}
       disabled={busy} className="mt-1 min-h-28 w-full min-w-0 border p-3 text-base md:text-sm"
       value={message} onChange={event=>editMessage(event.target.value)}
       onKeyDown={event=>{
        if(event.key==="Enter"&&(event.ctrlKey||event.metaKey||!event.shiftKey)&&
          !event.nativeEvent.isComposing){
         event.preventDefault();if(id&&message.trim())void create();
        }
       }}/>
     </label>
     <p className="text-xs text-muted-foreground leading-[20px]" aria-live="polite">
      Enter or Ctrl/Cmd+Enter to send · Shift+Enter for a new line · {message.length}/4000
     </p>
     <p className="text-xs text-muted-foreground leading-[20px]">
      This starts their General thread. Messages about a drive are best sent from that drive.
     </p>
     {error?<InlineNotice tone="error" message={error}/>:null}
     {createdThreadId?<a href={"/tpo/messages/"+encodeURIComponent(createdThreadId)}
      className="lms-inline-link inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 focus-visible:underline">Open conversation</a>:null}

    </form>
  </Dialog>
 </div>;
}
