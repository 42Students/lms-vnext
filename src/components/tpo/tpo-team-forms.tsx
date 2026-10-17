"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {tpoTeamFormErrorMessage} from "@/modules/placements/tpo-team-form-feedback-model";

type Member={membershipId:string;displayName:string};
async function postForm(url:string,values:Record<string,string>){
 const body=new FormData();
 for(const [key,value] of Object.entries(values))body.set(key,value);
 const response=await fetch(url,{method:"POST",credentials:"same-origin",body,redirect:"manual"});
 if(response.type==="opaqueredirect"||response.status===303)return {ok:true};
 if(!response.ok){
  const payload=await response.json().catch(()=>null) as {error?:string}|null;
  return {ok:false,code:payload?.error??"UNKNOWN"};
 }
 return {ok:true};
}
export function TpoTeamThreadCreate({members}:{members:Member[]}){
 const router=useRouter();
 const [recipient,setRecipient]=useState(""),[topic,setTopic]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function create(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||!recipient||!topic.trim())return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/placements/tpo/team/threads",{
    method:"POST",credentials:"same-origin",redirect:"follow",
    body:(()=>{const form=new FormData();form.set("recipientMembershipId",recipient);form.set("topic",topic.trim());return form;})(),
   });
   if(!response.ok){
    const payload=await response.json().catch(()=>null) as {error?:string}|null;
    setError(tpoTeamFormErrorMessage(payload?.error??"UNKNOWN","CREATE"));return;
   }
   router.push(new URL(response.url).pathname);router.refresh();
  }catch{setError(tpoTeamFormErrorMessage("UNKNOWN","CREATE"));}
  finally{setBusy(false);}
 }
 return <form onSubmit={event=>void create(event)} className="mt-4 grid gap-3 rounded-lg border border-border p-4">
  <h3 className="font-semibold text-foreground">Start a private TPO conversation</h3>
  <label className="grid gap-1 text-sm text-body">Team member
   <select required value={recipient} onChange={event=>setRecipient(event.target.value)} disabled={busy}
    className="min-h-11 rounded-md border border-border bg-surface px-3">
    <option value="">Choose an active TPO colleague</option>
    {members.map(member=><option key={member.membershipId} value={member.membershipId}>{member.displayName}</option>)}
   </select>
  </label>
  <label className="grid gap-1 text-sm text-body">Topic
   <input required value={topic} onChange={event=>setTopic(event.target.value)} maxLength={160} disabled={busy}
    className="min-h-11 rounded-md border border-border bg-surface px-3" placeholder="Drive coordination"/>
  </label>
  <p className="text-xs text-muted-foreground">Only named active TPO members can take part.</p>
  {error?<p role="alert" className="text-sm text-danger">{error}</p>:null}
  <button type="submit" disabled={busy||!recipient||!topic.trim()}
   className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
   {busy?"Starting…":"Start conversation"}
  </button>
 </form>;
}
export function TpoTeamReplyComposer({threadId}:{threadId:string}){
 const router=useRouter();
 const [body,setBody]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [success,setSuccess]=useState("");
 async function send(){
  if(busy||!body.trim())return;
  setBusy(true);setError("");setSuccess("");
  try{
   const result=await postForm("/api/placements/tpo/team/threads/"+encodeURIComponent(threadId)+"/messages",{body:body.trim()});
   if(!result.ok){setError(tpoTeamFormErrorMessage(result.code??"UNKNOWN","REPLY"));return;}
   setBody("");setSuccess("Sent");router.refresh();
  }catch{setError(tpoTeamFormErrorMessage("UNKNOWN","REPLY"));}
  finally{setBusy(false);}
 }
 return <form onSubmit={event=>{event.preventDefault();void send();}}
   className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="font-semibold text-foreground">Reply privately</h2>
  <label className="grid gap-1 text-sm text-body">Message
   <textarea required value={body} maxLength={4000} rows={4} disabled={busy}
    onChange={event=>setBody(event.target.value)}
    onKeyDown={event=>{
     if(event.key==="Enter"&&!event.shiftKey&&!event.nativeEvent.isComposing){
      event.preventDefault();void send();
     }
    }}
    className="rounded-md border border-border bg-surface p-3" placeholder="Share a private team update"/>
  </label>
  <p className="text-xs text-muted-foreground" aria-live="polite">Enter to send · Shift+Enter for a new line · {body.length}/4000</p>
  {error?<p role="alert" className="text-sm text-danger">{error}</p>:null}
  {success?<p role="status" className="text-sm text-body">{success}</p>:null}
  <button type="submit" disabled={busy||!body.trim()}
   className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
   {busy?"Sending…":"Send"}
  </button>
 </form>;
}
