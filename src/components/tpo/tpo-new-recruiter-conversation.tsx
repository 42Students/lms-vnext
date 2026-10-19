"use client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {useEffect,useRef,useState} from "react";
import {Dialog} from "@/components/ui/dialog";
import {useRouter} from "next/navigation";
import {TPO_QUICK_REPLIES} from "@/modules/placements/tpo-message-draft-model";

type Recruiter={userId:string;displayName:string|null;companyName:string};
export function TpoNewRecruiterConversation({recruiters,actorUserId}:{
 recruiters:Recruiter[];actorUserId:string;
}){
 const router=useRouter();
 const [open,setOpen]=useState(false),[id,setId]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [createdThreadId,setCreatedThreadId]=useState<string|null>(null);
 const selectRef=useRef<HTMLSelectElement>(null);
 const launchRef=useRef<HTMLButtonElement>(null);
 const inFlightRef=useRef(false);
 const draftKey="tpo-new-recruiter-message:"+actorUserId;

 function editMessage(value:string){
  setMessage(value);
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
   if(!sent.ok)throw new Error("Conversation opened, but the message was not sent. Retry or open the conversation.");
   editMessage("");
   router.push("/tpo/messages/"+encodeURIComponent(threadId));
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Couldn't start conversation.");}
  finally{inFlightRef.current=false;setBusy(false);}
 }
 return <div>
  <Button variant="secondary" ref={launchRef} type="button" className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold"
   onClick={()=>open?close():openDialog()}>New message</Button>
  <Dialog open={open} onOpenChange={next=>{if(!next)close();}} dismissible={!busy}
   title="New message to a recruiter">
    <form onSubmit={event=>{event.preventDefault();void create();}} className="space-y-3">
     <label className="block text-sm font-semibold text-body">Recruiter
      <Select ref={selectRef} aria-label="Recruiter" required value={id}
       onChange={e=>{setId(e.target.value);setCreatedThreadId(null);}}
       className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-2">
       <option value="">Choose a recruiter</option>
       {recruiters.map(r=><option key={r.userId} value={r.userId}>
        {(r.displayName?.trim()||"Unnamed recruiter")+" · "+r.companyName}
       </option>)}
      </Select>
     </label>
     <div role="group" aria-label="Quick replies" className="flex flex-wrap gap-2">
      {TPO_QUICK_REPLIES.map(reply=><Button variant="secondary" key={reply} type="button" disabled={busy}
       onClick={()=>editMessage(message?message+" "+reply:reply)}
       className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-3 text-xs">{reply}</Button>)}
     </div>
     <label className="block text-sm font-semibold text-body">Message
      <Textarea aria-label="New message" placeholder="Write a message" required maxLength={4000}
       className="mt-1 min-h-28 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-base sm:text-sm"
       value={message} onChange={event=>editMessage(event.target.value)}
       onKeyDown={event=>{
        if(event.key==="Enter"&&(event.ctrlKey||event.metaKey||!event.shiftKey)&&
          !event.nativeEvent.isComposing){
         event.preventDefault();if(id&&message.trim())void create();
        }
       }}/>
     </label>
     <p className="text-xs text-muted-foreground" aria-live="polite">
      Enter or Ctrl/Cmd+Enter to send · Shift+Enter for a new line · {message.length}/4000
     </p>
     <p className="text-xs text-muted-foreground">
      This starts their General thread. Messages about a drive are best sent from that drive.
     </p>
     {recruiters.length===0?<p role="status" className="text-sm text-body">
      No recruiters have verified, active placement access.</p>:null}
     {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
     {createdThreadId?<a href={"/tpo/messages/"+encodeURIComponent(createdThreadId)}
      className="text-sm font-semibold text-[var(--lms-teal-deep)] underline">Open conversation</a>:null}
     <div className="flex justify-end gap-2">
      <Button variant="secondary" type="button" onClick={()=>editMessage("")} disabled={!message||busy}
       className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm">Discard draft</Button>
      <Button variant="primary" type="submit" disabled={!id||!message.trim()||busy}
       className="min-h-11 sm:min-h-9">
       {busy?"Sending…":"Send"}
      </Button>
     </div>
    </form>
  </Dialog>
 </div>;
}
