"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {InlineNotice} from "@/components/ui/inline-notice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {isVerifiedHrReplyReceipt,hrReplyErrorMessage} from "@/modules/placements/hr-conversation-send-feedback-model";
/** Never carry a recruiter draft across two different employer-college threads. */
export function RecruiterConversationReplyForm({threadId,quoteId,quoteLabel,historyAvailable=true}:{
 threadId:string;quoteId?:string|null;quoteLabel?:string|null;historyAvailable?:boolean;
}){
 return <RecruiterConversationReplyFormState key={threadId+":"+(quoteId??"")} threadId={threadId}
   quoteId={quoteId} quoteLabel={quoteLabel} historyAvailable={historyAvailable}/>;
}
function RecruiterConversationReplyFormState({threadId,quoteId,quoteLabel,historyAvailable}:{
 threadId:string;quoteId?:string|null;quoteLabel?:string|null;historyAvailable:boolean;
}){
 const router=useRouter();
 const {run:runGuarded}=useGuardedAction({timeoutMs:15000});
 const formRef=useRef<HTMLFormElement>(null);
 const inputRef=useRef<HTMLTextAreaElement>(null);
 const navigating=useRef(false);
 const submitPendingRef=useRef(false);
 const [body,setBody]=useState("");
 const [selectedQuote,setSelectedQuote]=useState(quoteId??null);
 const [sending,setSending]=useState(false);
 const [notice,setNotice]=useState("");
 const [leaveHref,setPendingLeave]=useState<string|null>(null);
 useEffect(()=>{
  if(!body.trim()&&!sending)return;
  const warn=(event:BeforeUnloadEvent)=>{
    if(navigating.current)return;
    event.preventDefault();
    event.returnValue="";
  };
  window.addEventListener("beforeunload",warn);
  const intercept=(event:MouseEvent)=>{
   if(navigating.current)return;
   const target=event.target;
   if(!(target instanceof Element))return;
   const anchor=target.closest("a[href]");
   if(!(anchor instanceof HTMLAnchorElement)||event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
   const destination=new URL(anchor.href,window.location.href);
   if(destination.origin!==window.location.origin || (destination.pathname===window.location.pathname &&
      destination.search===window.location.search && destination.hash===window.location.hash))return;
   event.preventDefault();event.stopPropagation();
   setPendingLeave(destination.pathname+destination.search+destination.hash);
  };
  document.addEventListener("click",intercept,true);
  return ()=>{window.removeEventListener("beforeunload",warn);document.removeEventListener("click",intercept,true);};
 },[body,sending]);

 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(sending||submitPendingRef.current||!historyAvailable)return;
  const message=body.trim();
  if(message.length===0){
   setNotice("Write a message first");
   return;
  }
  if(message.length>4000){
   setNotice("Keep a message under 4000 characters");
   return;
  }
  submitPendingRef.current=true;
  setSending(true);
  try{
  setNotice("");
  let confirmed=false;
  let feedback="The message was not confirmed as sent. Check the thread before retrying.";
  try{
   const form=new FormData();
   form.set("body",message);
    if(selectedQuote)form.set("quoteId",selectedQuote); // legacy change-request quote retained
   const response=await runGuarded(()=>fetch("/api/placements/recruiter/conversations/"+threadId+"/reply",{
    method:"POST",body:form,credentials:"same-origin",redirect:"error",
    headers:{Accept:"application/json"},
   }));
   if(!response)throw new Error("REPLY_UNCONFIRMED");
   const receipt:unknown=response.ok?await response.json().catch(()=>null):null;
   confirmed=response.ok&&isVerifiedHrReplyReceipt(receipt,threadId);
   if(!confirmed)feedback=hrReplyErrorMessage(response.status);
  }catch{
   feedback="Could not reach the server. Check this conversation before retrying.";
  }
  if(confirmed){
   setBody("");
   setSelectedQuote(null);
   // Confirm that the current authorized thread remains readable before
   // claiming the refreshed conversation is visible to the recruiter.
   try{
    const latest=await fetch(window.location.pathname,{method:"GET",
      credentials:"same-origin",cache:"no-store"});
    if(!latest.ok)throw new Error("REFRESH_FAILED");
    setNotice("Message sent");
   }catch{
    setNotice("Message sent, but the conversation could not refresh. Retry to load the latest messages.");
   }
   router.refresh();
  }else setNotice("Message was not sent. Could not send. "+feedback);
  }finally{submitPendingRef.current=false;setSending(false);}
 }
 return <form ref={formRef} onSubmit={submit} className="min-w-0 max-w-4xl space-y-4 border-t border-[var(--lms-canvas-border)] pt-4">
  <h2 className="text-lg font-semibold leading-7 text-foreground">Reply to placement cell</h2>
  {selectedQuote?<div className="flex min-w-0 flex-wrap items-center gap-2 border-l-2 border-[var(--lms-primary)] bg-surface-secondary px-3 py-2 text-sm text-body">
    <span>Discussing change request: {quoteLabel??selectedQuote}</span>
    <Button type="button" size="sm" variant="secondary" disabled={sending} onClick={()=>setSelectedQuote(null)}>Remove quote</Button>
  </div>:null}
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Message
   <Textarea ref={inputRef} value={body} onChange={event=>setBody(event.target.value)}
    onKeyDown={event=>{if(event.key==="Enter"&&(event.ctrlKey||event.metaKey)){event.preventDefault();formRef.current?.requestSubmit();}}}
    rows={3} maxLength={4000} disabled={sending||!historyAvailable}
    aria-invalid={body.trim().length>4000}
    className="min-h-28 w-full"
    placeholder="Write to placement cell"/>
  </label>
  <p className="text-xs text-muted-foreground leading-5">
   <span className={body.trim().length>4000?"font-semibold text-error":undefined}>{body.trim().length}/4000 characters</span> · Press Ctrl or Cmd+Enter to send. Replies stay in this employer-college thread and are reauthorized when sent.
  </p>
  {!historyAvailable?<InlineNotice tone="warning"
    message="Conversation history could not be loaded. Reload this thread before sending a reply."/>:null}
  {notice?<InlineNotice tone={notice.startsWith("Message was not sent")||notice.startsWith("Could not")||notice.startsWith("Write a")||notice.startsWith("Keep a")?"error":"info"} message={notice}/>:null}
  <div className="flex min-w-0 flex-col items-stretch gap-2 min-[768px]:flex-row min-[768px]:items-center">
  <Button type="submit" disabled={sending||!historyAvailable||!body.trim()||body.trim().length>4000}
    loading={sending} className="min-h-11 w-full min-[768px]:min-h-9 min-[768px]:w-auto">
   {sending?"Sending…":"Send reply"}
  </Button>
  <ConfirmDialog open={leaveHref!==null} onOpenChange={next=>{
     if(!next){setPendingLeave(null);inputRef.current?.focus();}
    }} title="Discard this unsent message?"
   description="Your draft reply will be lost."
   cancelLabel="Keep writing" confirmLabel="Discard message" confirmVariant="danger"
   onConfirm={()=>{
    const href=leaveHref;navigating.current=true;setPendingLeave(null);setBody("");
    if(href)router.push(href);
   }}/>
  </div>
 </form>;
}
