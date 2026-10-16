"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
type Recruiter={userId:string;displayName:string|null;companyName:string};
export function TpoNewRecruiterConversation({recruiters}:{recruiters:Recruiter[]}){
 const router=useRouter();
 const [open,setOpen]=useState(false),[id,setId]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [createdThreadId,setCreatedThreadId]=useState<string|null>(null);
 async function create(){
  if(!id||!message.trim()||message.trim().length>4000)return;
  setBusy(true);setError("");
  try{
   const res=await fetch("/api/placements/tpo/messages/threads",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({recruiterUserId:id}),
   });
   if(!res.ok)throw new Error(res.status===403?"You do not have permission to start this conversation.":
     "This recruiter no longer has active placement access. Please refresh.");
   const result=await res.json() as {threadId:string};
   setCreatedThreadId(result.threadId);
   const sent=await fetch("/api/placements/tpo/messages/threads/"+encodeURIComponent(result.threadId)+"/messages",{
     method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({body:message.trim()}),
   });
   if(!sent.ok){
     setError("Conversation opened, but the message was not sent. Open the conversation to retry.");
     return;
   }
   setMessage("");
   router.push("/tpo/messages/"+encodeURIComponent(result.threadId));
  }catch(e){setError(e instanceof Error?e.message:"Couldn't start conversation.");}
  finally{setBusy(false);}
 }
 return <div>
  <button type="button" className="min-h-10 rounded-md border border-border bg-surface px-4 text-sm font-semibold"
    onClick={()=>{
      if(open&&message.trim()&&!window.confirm("Discard draft?"))return;
      if(open)setMessage("");
      setOpen(value=>!value);
    }}>New message</button>
  {open?<div role="group" aria-label="New message to a recruiter" className="mt-2 space-y-2 rounded-md border border-border bg-surface p-3">
   <label className="block text-sm font-semibold text-body">Recruiter
    <select aria-label="Recruiter" required value={id} onChange={e=>setId(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-2">
     <option value="">Choose a recruiter</option>
     {recruiters.map(r=><option key={r.userId} value={r.userId}>
       {(r.displayName?.trim()||"Unnamed recruiter")+" · "+r.companyName}
      </option>)}
    </select>
   </label>
   <label className="block text-sm font-semibold text-body">Message
      <textarea aria-label="New message" placeholder="Write a message" required maxLength={4000}
        className="mt-1 min-h-28 w-full rounded-md border border-border bg-surface p-3"
        value={message} onChange={event=>setMessage(event.target.value)}/>
   </label>
   <p className="text-xs text-muted-foreground">
     This starts their General thread. Messages about a drive are best sent from that drive.
   </p>
   {recruiters.length===0?<p role="status" className="text-sm text-body">
     No recruiters have verified, active placement access.</p>:null}
   {error?<p role="alert" className="text-sm text-body">{error}</p>:null}
   {createdThreadId?<a href={"/tpo/messages/"+encodeURIComponent(createdThreadId)}
    className="text-sm font-semibold text-primary-text underline">Open conversation</a>:null}
   <button type="button" disabled={!id||!message.trim()||busy||Boolean(createdThreadId)} onClick={()=>void create()}
     className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
    {busy?"Sending…":"Send"}
   </button>
  </div>:null}
 </div>;
}
