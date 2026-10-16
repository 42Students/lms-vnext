"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function TpoRecruiterMessageReply({threadId,unread}:{
 threadId:string;unread:boolean;
}){
 const router=useRouter();
 const [body,setBody]=useState(""),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[success,setSuccess]=useState("");
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
   if(mode==="messages"){setBody("");setSuccess("Message sent");}
   else setSuccess("Messages marked read");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Couldn't save. Please try again.");}
  finally{setBusy(false);}
 }
 return <section className="rounded-xl border border-border bg-surface p-5 space-y-3" aria-label="Reply to recruiter">
  <h2 className="font-semibold text-foreground">Reply</h2>
  <form onSubmit={event=>{event.preventDefault();void post("messages");}} className="space-y-3">
   <label className="block text-sm text-body">Message
    <textarea className="mt-1 min-h-28 w-full rounded-md border border-border bg-surface p-3 text-foreground"
      maxLength={4000} required value={body} onChange={e=>setBody(e.target.value)}
      onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();if(body.trim()&&!busy)void post("messages");}}}/>
   </label>
   <div className="flex flex-wrap gap-2">
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
