"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmActionDialog} from "@/components/ui/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {isVerifiedHrReplyReceipt,hrReplyErrorMessage} from "@/modules/placements/hr-conversation-send-feedback-model";
/** Never carry a recruiter draft across two different employer-college threads. */
export function RecruiterConversationReplyForm({threadId}:{threadId:string}){
 return <RecruiterConversationReplyFormState key={threadId} threadId={threadId}/>;
}
function RecruiterConversationReplyFormState({threadId}:{threadId:string}){
 const router=useRouter();
 const {run:runGuarded}=useGuardedAction({timeoutMs:15000});
 const formRef=useRef<HTMLFormElement>(null);
 const submitPendingRef=useRef(false);
 const [body,setBody]=useState("");
 const [sending,setSending]=useState(false);
 const [notice,setNotice]=useState("");
 const [leaveHref,setPendingLeave]=useState<string|null>(null);
 useEffect(()=>{
  if(!body.trim()&&!sending)return;
  const warn=(event:BeforeUnloadEvent)=>{
    event.preventDefault();
    event.returnValue="";
  };
  window.addEventListener("beforeunload",warn);
  const intercept=(event:MouseEvent)=>{
   const target=event.target;
   if(!(target instanceof Element))return;
   const anchor=target.closest("a[href]");
   if(!(anchor instanceof HTMLAnchorElement))return;
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
  if(sending||submitPendingRef.current)return;
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
  }else setNotice("Could not send. "+feedback);
  }finally{submitPendingRef.current=false;setSending(false);}
 }
 return <form ref={formRef} onSubmit={submit} className="space-y-3 border-t border-border pt-4">
  <h2 className="font-semibold text-foreground">Reply to placement cell</h2>
  <label className="grid gap-2 text-sm text-body">Message
   <Textarea value={body} onChange={event=>setBody(event.target.value)}
    onKeyDown={event=>{if(event.key==="Enter"&&(event.ctrlKey||event.metaKey)){event.preventDefault();formRef.current?.requestSubmit();}}}
    rows={4} disabled={sending} aria-invalid={body.trim().length>4000}
    className="w-full"
    placeholder="Write a message to the placement cell"/>
  </label>
  <p className="text-xs text-muted-foreground">
   <span className={body.trim().length>4000?"font-semibold text-error":undefined}>{body.trim().length}/4000 characters</span> · Press Ctrl or Cmd+Enter to send. Replies stay in this employer-college thread and are reauthorized when sent.
  </p>
  {notice?<p role={notice.startsWith("Could not") || notice.startsWith("Write a") || notice.startsWith("Keep a") ? "alert" : "status"}
   className={notice.startsWith("Could not") || notice.startsWith("Write a") || notice.startsWith("Keep a") ? "text-sm text-[var(--lms-error-text)]" : "text-sm text-body"}>{notice}</p>:null}
  <div className="flex flex-wrap items-center gap-3">
  <Button type="submit" disabled={sending} loading={sending}>
   {sending?"Sending…":"Send reply"}
  </Button>
  <ConfirmActionDialog open={leaveHref!==null} title="Discard this unsent message?"
   consequence="Your draft reply will be lost." confirmLabel="Discard"
   onCancel={()=>setPendingLeave(null)} onConfirm={()=>{
    const href=leaveHref;setPendingLeave(null);setBody("");
    if(href)router.push(href);
   }}/>
  </div>
 </form>;
}
