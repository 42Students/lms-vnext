"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {tpoTeamFormErrorMessage} from "@/modules/placements/tpo-team-form-feedback-model";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";

type Member={membershipId:string;displayName:string};
async function postForm(url:string,values:Record<string,string>){
 const body=new FormData();
 for(const [key,value] of Object.entries(values))body.set(key,value);
 try{
  const reply=await apiFetch<{id?:string;href?:string}>(url,{
   method:"POST",credentials:"same-origin",
   headers:{Accept:"application/json"},body,timeoutMs:30000,
  });
  if(!reply||typeof reply.id!=="string")
   return {ok:false,code:"INVALID_RESPONSE",message:friendlyApiError({status:502})};
  return {ok:true,href:reply.href};
 }catch(reason){
  if(reason instanceof FriendlyFetchError)
   return {ok:false,code:reason.code??"UNKNOWN",message:reason.message};
  return {ok:false,code:"UNKNOWN",message:friendlyApiError({network:true})};
 }
}
export function TpoTeamThreadCreate({members,actorUserId}:{members:Member[];actorUserId:string}){
 const router=useRouter();
 const draftKey="tpo-team-start:"+actorUserId;
 const pending=useRef(false);
 const createKey=useRef<string|null>(null);
 const [recipient,setRecipient]=useState(""),[topic,setTopic]=useState("");
 useEffect(()=>{
  const handle=window.setTimeout(()=>{
   try {const raw=sessionStorage.getItem(draftKey);if(!raw)return;
    const parsed=JSON.parse(raw) as {recipient?:string;topic?:string};
    createKey.current=sessionStorage.getItem(draftKey+":createKey");
    if(parsed.topic&&parsed.topic.length<=200)setTopic(parsed.topic);
    if(parsed.recipient&&members.some(member=>member.membershipId===parsed.recipient))setRecipient(parsed.recipient);
   }catch{/* Storage is optional. */}
  },0);
  return ()=>window.clearTimeout(handle);
 },[draftKey,members]);
 function updateDraft(nextRecipient:string,nextTopic:string){
  setRecipient(nextRecipient);setTopic(nextTopic);createKey.current=null;
  try{sessionStorage.setItem(draftKey,JSON.stringify({recipient:nextRecipient,topic:nextTopic}));
   sessionStorage.removeItem(draftKey+":createKey");}catch{/* Optional. */}
 }
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function create(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending.current||busy||!recipient||!topic.trim())return;
  pending.current=true;setBusy(true);setError("");
  try{
   if(!createKey.current){createKey.current=crypto.randomUUID();
    try{sessionStorage.setItem(draftKey+":createKey",createKey.current);}catch{/* Optional. */}}
   const result=await postForm("/api/placements/tpo/team/threads",{
    recipientMembershipId:recipient,topic:topic.trim(),idempotencyKey:createKey.current,
   });
   if(!result.ok||!result.href){
    setError(result.code==="RECIPIENT_NOT_FOUND"||result.code==="SESSION_EXPIRED"||result.code==="STALE_MESSAGE"?
     tpoTeamFormErrorMessage(result.code,"CREATE"):
     result.message??tpoTeamFormErrorMessage(result.code??"UNKNOWN","CREATE"));return;
   }
   try{sessionStorage.removeItem(draftKey);
    sessionStorage.removeItem(draftKey+":createKey");}catch{/* Optional. */}
   router.push(result.href);router.refresh();
  }catch{setError(tpoTeamFormErrorMessage("UNKNOWN","CREATE"));}
  finally{pending.current=false;setBusy(false);}
 }
 return <form onSubmit={event=>void create(event)} className="mt-4 grid gap-3 rounded-lg border border-border p-4">
  <h3 className="font-semibold text-foreground">Start a private TPO conversation</h3>
  <label className="grid gap-1 text-sm text-body">Team member
   <select required value={recipient} onChange={event=>updateDraft(event.target.value,topic)} disabled={busy}
    className="min-h-11 rounded-md border border-border bg-surface px-3">
    <option value="">Choose an active TPO colleague</option>
    {members.map(member=><option key={member.membershipId} value={member.membershipId}>{member.displayName}</option>)}
   </select>
  </label>
  <label className="grid gap-1 text-sm text-body">Topic
   <input required value={topic} onChange={event=>updateDraft(recipient,event.target.value)} maxLength={200} disabled={busy}
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
export function TpoTeamReplyComposer({threadId,actorUserId}:{threadId:string;actorUserId:string}){
 const router=useRouter();
 const pending=useRef(false);
 const sendKey=useRef<string|null>(null);
 const draftKey="tpo-team-reply:"+actorUserId+":"+threadId;
 const [body,setBody]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [markDecision,setMarkDecision]=useState(false);
 useEffect(()=>{
  const task=window.setTimeout(()=>{
   try{const saved=sessionStorage.getItem(draftKey);if(saved&&saved.length<=4000)setBody(saved);
    sendKey.current=sessionStorage.getItem(draftKey+":sendKey");}catch{/* Optional. */}
  },0);
  return ()=>window.clearTimeout(task);
 },[draftKey]);
 useEffect(()=>{
  if(!body.trim())return;
  const protect=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",protect);
  return ()=>window.removeEventListener("beforeunload",protect);
 },[body]);
 function changeBody(next:string){setBody(next);sendKey.current=null;
  try{if(next)sessionStorage.setItem(draftKey,next);else sessionStorage.removeItem(draftKey);
   sessionStorage.removeItem(draftKey+":sendKey");}catch{/* Optional. */}
 }
 const [success,setSuccess]=useState("");
 async function send(){
  if(pending.current||busy||!body.trim())return;
  pending.current=true;setBusy(true);setError("");setSuccess("");
  try{
   if(!sendKey.current){sendKey.current=crypto.randomUUID();
    try{sessionStorage.setItem(draftKey+":sendKey",sendKey.current);}catch{/* Optional. */}}
   const result=await postForm("/api/placements/tpo/team/threads/"+encodeURIComponent(threadId)+"/messages",{
    body:body.trim(),idempotencyKey:sendKey.current,markDecision:String(markDecision),
   });
   if(!result.ok){setError(result.code==="TEAM_PARTICIPANT_INACTIVE"||result.code==="STALE_MESSAGE"||result.code==="SESSION_EXPIRED"?
    tpoTeamFormErrorMessage(result.code,"REPLY"):
    result.message??tpoTeamFormErrorMessage(result.code??"UNKNOWN","REPLY"));return;}
   changeBody("");setMarkDecision(false);setSuccess("Sent");router.refresh();
  }catch{setError(tpoTeamFormErrorMessage("UNKNOWN","REPLY"));}
  finally{pending.current=false;setBusy(false);}
 }
 return <form onSubmit={event=>{event.preventDefault();void send();}}
   className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="font-semibold text-foreground">Reply privately</h2>
  <label className="grid gap-1 text-sm text-body">Message
   <textarea required value={body} maxLength={4000} rows={4} disabled={busy}
    onChange={event=>changeBody(event.target.value)}
    onKeyDown={event=>{
     if(event.key==="Enter"&&!event.shiftKey&&!event.nativeEvent.isComposing){
      event.preventDefault();void send();
     }
    }}
    className="rounded-md border border-border bg-surface p-3" placeholder="Share a private team update"/>
  </label>
  <label className="flex items-center gap-2 text-sm">
   <input type="checkbox" checked={markDecision} disabled={busy}
    onChange={event=>{setMarkDecision(event.target.checked);sendKey.current=null;}}/>
   Mark as decision
  </label>
  {markDecision?<p role="status" className="text-xs text-muted-foreground">Will be pinned as a decision</p>:null}
  <p className="text-xs text-muted-foreground" aria-live="polite">Enter to send · Shift+Enter for a new line · {body.length}/4000</p>
  {error?<p role="alert" className="text-sm text-danger">{error}</p>:null}
  {success?<p role="status" className="text-sm text-body">{success}</p>:null}
  <button type="submit" disabled={busy||!body.trim()}
   className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
   {busy?"Sending…":"Send"}
  </button>
 </form>;
}
