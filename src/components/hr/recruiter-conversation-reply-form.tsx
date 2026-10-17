"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {ConfirmActionDialog} from "@/components/ui/confirm-action-dialog";
import {hrReplySuccess,hrReplyErrorMessage} from "@/modules/placements/hr-conversation-send-feedback-model";
export function RecruiterConversationReplyForm({threadId}:{threadId:string}){
 const router=useRouter();
 const formRef=useRef<HTMLFormElement>(null);
 const [body,setBody]=useState("");
 const [sending,setSending]=useState(false);
 const [notice,setNotice]=useState("");
 const [leaveHref,setLeaveHref]=useState<string|null>(null);
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
   const url=new URL(anchor.href,window.location.href);
   if(url.origin!==window.location.origin || url.pathname===window.location.pathname)return;
   event.preventDefault();event.stopPropagation();
   setLeaveHref(url.pathname+url.search+url.hash);
  };
  document.addEventListener("click",intercept,true);
  return ()=>{window.removeEventListener("beforeunload",warn);document.removeEventListener("click",intercept,true);};
 },[body,sending]);

 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(sending)return;
  const message=body.trim();
  if(message.length===0){
   setNotice("Write a message first");
   return;
  }
  if(message.length>4000){
   setNotice("Keep a message under 4000 characters");
   return;
  }
  setSending(true);
  setNotice("");
  let confirmed=false;
  let feedback="The message was not confirmed as sent. Check the thread before retrying.";
  try{
   const form=new FormData();
   form.set("body",message);
   const response=await fetch("/api/placements/recruiter/conversations/"+threadId+"/reply",{
    method:"POST",body:form,credentials:"same-origin",
   });
   const redirectPath=new URL(response.url).pathname;
   confirmed=hrReplySuccess({status:response.status,redirected:response.redirected,
    redirectPath,threadId});
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
  setSending(false);
 }
 return <form ref={formRef} onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="font-semibold text-foreground">Reply to placement cell</h2>
  <label className="grid gap-2 text-sm text-body">Message
   <textarea value={body} onChange={event=>setBody(event.target.value)}
    onKeyDown={event=>{if(event.key==="Enter"&&(event.ctrlKey||event.metaKey)){event.preventDefault();formRef.current?.requestSubmit();}}}
    rows={4} disabled={sending} aria-invalid={body.trim().length>4000}
    className="rounded-md border border-border bg-surface p-3"
    placeholder="Write a message to the placement cell"/>
  </label>
  <p className="text-xs text-muted-foreground">
   <span className={body.trim().length>4000?"font-semibold text-error":undefined}>{body.trim().length}/4000 characters</span> · Press Ctrl or Cmd+Enter to send. Replies stay in this employer-college thread and are reauthorized when sent.
  </p>
  {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
  <div className="flex flex-wrap items-center gap-3">
  <button type="submit" disabled={sending}
   className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-60">
   {sending?"Sending…":"Send reply"}
  </button>
  <ConfirmActionDialog open={leaveHref!==null} title="Discard this unsent message?"
   consequence="Your draft reply will be lost." confirmLabel="Discard"
   onCancel={()=>setLeaveHref(null)} onConfirm={()=>{
    const destination=leaveHref;setLeaveHref(null);setBody("");
    if(destination)router.push(destination);
   }}/>
  </div>
 </form>;
}
