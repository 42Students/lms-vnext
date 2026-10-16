"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {hrReplySuccess,hrReplyErrorMessage,hrReplyValidationError,HR_REPLY_REFRESH_FAILED,HR_REPLY_SEND_FAILED} from "@/modules/placements/hr-conversation-send-feedback-model";
export function RecruiterConversationReplyForm({threadId}:{threadId:string}){
 const router=useRouter();
 const [body,setBody]=useState("");
 const [sending,setSending]=useState(false);
 const [notice,setNotice]=useState("");
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(sending)return;
  const message=body.trim();
  const invalid=hrReplyValidationError(message);
  if(invalid){
   setNotice(invalid);
   return;
  }
  setSending(true);
  setNotice("");
  let confirmed=false;
  let feedback=HR_REPLY_SEND_FAILED;
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
   feedback=HR_REPLY_SEND_FAILED;
  }
  if(confirmed){
   setBody("");
   setNotice("Message sent");
   try { router.refresh(); }
   catch { setNotice(HR_REPLY_REFRESH_FAILED); }
  }else setNotice(feedback);
  setSending(false);
 }
 return <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="font-semibold text-foreground">Reply to placement cell</h2>
  <label className="grid gap-2 text-sm text-body">Message
   <textarea value={body} onChange={event=>setBody(event.target.value)}
    maxLength={4000} rows={4} disabled={sending}
    className="rounded-md border border-border bg-surface p-3"
    placeholder="Write a message to the placement cell"/>
  </label>
  <p className="text-xs text-muted-foreground">
   Replies stay in this employer-college thread and are reauthorized when sent.
  </p>
  {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
  <button type="submit" disabled={sending}
   className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-60">
   {sending?"Sending…":"Send reply"}
  </button>
 </form>;
}
