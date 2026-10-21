"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { InlineNotice } from "@/components/ui/inline-notice";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
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
 const [recipient,setRecipient]=useState(""),[topic,setTopic]=useState(""),[firstMessage,setFirstMessage]=useState("");
 const [kind,setKind]=useState<"DIRECT"|"TOPIC"|"DRIVE"|"COMPANY">("DIRECT");
 const [contextId,setContextId]=useState("");
 const [additional,setAdditional]=useState<string[]>([]);
 const [memberQuery,setMemberQuery]=useState("");
 const [highlighted,setHighlighted]=useState(0);
 const memberChoices=members.filter(m=>m.membershipId!==recipient&&
  m.displayName.toLocaleLowerCase().includes(memberQuery.trim().toLocaleLowerCase()));
 function toggleMember(id:string){
  setAdditional(previous=>previous.includes(id)?previous.filter(value=>value!==id):[...previous,id]);
  createKey.current=null;
 }
 function insertMemberMention(name:string){
  if(!name)return;
  const token="@"+name.trim();
  const next=(firstMessage.trim()?firstMessage.trim()+" ":"")+token+" ";
  updateDraft(recipient,topic,next.slice(0,4000));
 }
 useEffect(()=>{
  const handle=window.setTimeout(()=>{
   try {const raw=sessionStorage.getItem(draftKey);if(!raw)return;
    const parsed=JSON.parse(raw) as {recipient?:string;topic?:string;firstMessage?:string};
    createKey.current=sessionStorage.getItem(draftKey+":createKey");
    if(parsed.topic&&parsed.topic.length<=200)setTopic(parsed.topic);
    if(parsed.firstMessage&&parsed.firstMessage.length<=4000)setFirstMessage(parsed.firstMessage);
    if(parsed.recipient&&members.some(member=>member.membershipId===parsed.recipient))setRecipient(parsed.recipient);
   }catch{/* Storage is optional. */}
  },0);
  return ()=>window.clearTimeout(handle);
 },[draftKey,members]);
 function updateDraft(nextRecipient:string,nextTopic:string,nextFirstMessage=firstMessage){
  setRecipient(nextRecipient);setTopic(nextTopic);setFirstMessage(nextFirstMessage);createKey.current=null;
  try{sessionStorage.setItem(draftKey,JSON.stringify({recipient:nextRecipient,topic:nextTopic,firstMessage:nextFirstMessage}));
   sessionStorage.removeItem(draftKey+":createKey");}catch{/* Optional. */}
 }
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function create(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending.current||busy||!recipient||!topic.trim()||
   ((kind==="DRIVE"||kind==="COMPANY")&&!/^[0-9a-f-]{36}$/i.test(contextId))||
   (kind!=="DIRECT"&&additional.length===0))return;
  pending.current=true;setBusy(true);setError("");
  try{
   if(!createKey.current){createKey.current=crypto.randomUUID();
    try{sessionStorage.setItem(draftKey+":createKey",createKey.current);}catch{/* Optional. */}}
   const result=await postForm("/api/placements/tpo/team/threads",{
    recipientMembershipId:recipient,topic:topic.trim(),firstMessage:firstMessage.trim(),idempotencyKey:createKey.current,
    kind,participantMembershipIds:kind==="DIRECT"?"":additional.join(","),
    contextId:kind==="DRIVE"||kind==="COMPANY"?contextId:"",
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
 return <form onSubmit={event=>void create(event)} className="mt-4 grid gap-3 border-t border-border pt-4">
  <h3 className="font-semibold text-foreground">Start a placement team conversation</h3>
  <label className="grid gap-[6px] text-[13px] font-semibold">Conversation type
   <Select value={kind} disabled={busy} onChange={event=>{
    setKind(event.target.value as typeof kind);setAdditional([]);setContextId("");createKey.current=null;
   }} className="min-h-11 md:min-h-9">
    <option value="DIRECT">Private direct</option>
    <option value="TOPIC">About a topic or student</option>
    <option value="DRIVE">Drive discussion</option>
    <option value="COMPANY">Company discussion</option>
   </Select>
  </label>
  <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Team member
   <Select required value={recipient} onChange={event=>updateDraft(event.target.value,topic)} disabled={busy}
    className="min-h-11 md:min-h-9">
    <option value="">Choose an active placement team colleague</option>
    {members.map(member=><option key={member.membershipId} value={member.membershipId}>{member.displayName}</option>)}
   </Select>
  </label>
  {kind!=="DIRECT"?<fieldset className="grid gap-2 border-b border-border pb-3">
   <legend className="text-[13px] font-semibold">Additional team members</legend>
   <label className="grid gap-1 text-sm font-semibold">Find a colleague
     <Input value={memberQuery} disabled={busy} role="combobox" aria-expanded={memberChoices.length>0}
       aria-controls="tpo-team-member-choices" aria-autocomplete="list"
       aria-activedescendant={memberChoices[highlighted] ? "tpo-team-member-"+memberChoices[highlighted].membershipId : undefined}
       onChange={event=>{setMemberQuery(event.target.value);setHighlighted(0);}}
       onKeyDown={event=>{
        if(event.key==="ArrowDown"&&memberChoices.length>0){event.preventDefault();setHighlighted(i=>Math.min(memberChoices.length-1,i+1));}
        if(event.key==="ArrowUp"&&memberChoices.length>0){event.preventDefault();setHighlighted(i=>Math.max(0,i-1));}
        if(event.key==="Escape"){event.preventDefault();setMemberQuery("");setHighlighted(0);}
        if(event.key==="Enter"&&memberChoices[highlighted]){
          event.preventDefault();toggleMember(memberChoices[highlighted].membershipId);
        }
       }}
       placeholder="Search placement team members"/>
   </label>
   <div id="tpo-team-member-choices" role="listbox" aria-label="Team colleagues"
     className="max-h-48 space-y-1 overflow-y-auto">
   {memberChoices.map((member,index)=>

    <div key={member.membershipId} id={"tpo-team-member-"+member.membershipId} role="option" aria-selected={additional.includes(member.membershipId)}
      className={"flex min-h-11 items-center gap-2 rounded px-2 text-sm "+(highlighted===index?"bg-muted":"")}>
      <Checkbox checked={additional.includes(member.membershipId)} disabled={busy}
        onChange={()=>toggleMember(member.membershipId)} aria-label={"Add "+member.displayName}/>
      <span className="min-w-0 flex-1">{member.displayName}</span>
      <Button type="button" size="sm" variant="ghost" disabled={busy}
        onClick={()=>insertMemberMention(member.displayName)}>Mention</Button>
    </div>)}
   </div>
   <p className="text-xs text-muted-foreground">Private conversation · Only selected active teammates can view this discussion.</p>
  </fieldset>:null}
  {(kind==="DRIVE"||kind==="COMPANY")?<label className="grid gap-2 text-[13px] font-semibold">
   {kind==="DRIVE"?"Drive ID":"Company relationship ID"}
   <Input value={contextId} maxLength={36} required disabled={busy}
     onChange={event=>{setContextId(event.target.value);createKey.current=null;}}
     placeholder="Paste the ID from the authorized workspace"/>
  </label>:null}
  <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Topic
   <Input required value={topic} onChange={event=>updateDraft(recipient,event.target.value)} maxLength={200} disabled={busy}
    className="min-h-11 md:min-h-9" placeholder={kind==="DRIVE"?"Drive coordination":kind==="COMPANY"?"Company coordination":kind==="TOPIC"?"Topic or student discussion":"Private coordination"}/>
  </label>
  <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">First message (optional)
   <Textarea value={firstMessage} maxLength={4000} rows={3} disabled={busy}
    onChange={event=>updateDraft(recipient,topic,event.target.value)}
    className="w-full" placeholder="Tell the team what this is about"/>
  </label>
  <p className="text-xs text-muted-foreground">Only named, currently active placement team members can take part. Contexts are rechecked by the server.</p>
  {error?<InlineNotice tone="error" message={error}/>:null}
  <Button type="submit" disabled={busy||!recipient||!topic.trim()||
   (kind!=="DIRECT"&&additional.length===0)||
   ((kind==="DRIVE"||kind==="COMPANY")&&!/^[0-9a-f-]{36}$/i.test(contextId))}
   className="min-h-11 md:min-h-9">
   {busy?"Starting…":"Start conversation"}
  </Button>
 </form>;
}
export function TpoTeamReplyComposer({threadId,actorUserId,kind,mentionMembers=[]}:{
 threadId:string;actorUserId:string;kind:string;mentionMembers?:readonly Member[];
}){
 const router=useRouter();
 const pending=useRef(false);
 const sendKey=useRef<string|null>(null);
 const draftKey="tpo-team-reply:"+actorUserId+":"+threadId;
 const [body,setBody]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [markDecision,setMarkDecision]=useState(false);
 const [success,setSuccess]=useState("");
 const [mentioned,setMentioned]=useState<string[]>([]);
 const [memberSearch,setMemberSearch]=useState("");
 const [confirmAdd,setConfirmAdd]=useState(false);
 const matchingMembers=mentionMembers.filter(person=>person.displayName.toLowerCase()
  .includes(memberSearch.trim().toLowerCase()));
 useEffect(()=>{
  const task=window.setTimeout(()=>{
   try{
    const saved=sessionStorage.getItem(draftKey);
    if(saved&&saved.length<=4000)setBody(saved);
    sendKey.current=sessionStorage.getItem(draftKey+":sendKey");
   }catch{/* Optional per-tab draft. */}
  },0);
  return ()=>window.clearTimeout(task);
 },[draftKey]);
 useEffect(()=>{
  if(!body.trim())return;
  const protect=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",protect);
  return ()=>window.removeEventListener("beforeunload",protect);
 },[body]);
 function changeBody(next:string){
  setBody(next);sendKey.current=null;setConfirmAdd(false);
  try{
   if(next)sessionStorage.setItem(draftKey,next);
   else sessionStorage.removeItem(draftKey);
   sessionStorage.removeItem(draftKey+":sendKey");
  }catch{/* Optional per-tab draft. */}
 }
 function toggleMention(id:string,checked:boolean){
  setMentioned(previous=>checked?[...new Set([...previous,id])]:previous.filter(value=>value!==id));
  sendKey.current=null;setError("");setConfirmAdd(false);
 }
 async function send(addPeople=false){
  if(pending.current||busy||!body.trim())return;
  pending.current=true;setBusy(true);setError("");setSuccess("");
  try{
   if(!sendKey.current){
    sendKey.current=crypto.randomUUID();
    try{sessionStorage.setItem(draftKey+":sendKey",sendKey.current);}catch{/* Optional. */}
   }
   const result=await postForm(
    "/api/placements/tpo/team/threads/"+encodeURIComponent(threadId)+"/messages",{
     body:body.trim(),idempotencyKey:sendKey.current,
     markDecision:String(markDecision),
     mentionMembershipIds:mentioned.join(","),
     addMentionedMembers:String(addPeople),
    });
   if(!result.ok){
    if(result.code==="ADD_PEOPLE"){setConfirmAdd(true);return;}
    setError(result.code==="TEAM_PARTICIPANT_INACTIVE"||
     result.code==="STALE_MESSAGE"||result.code==="SESSION_EXPIRED"?
      tpoTeamFormErrorMessage(result.code,"REPLY"):
     result.code==="TEAM_MENTION_NOT_FOUND"?
      "A mentioned teammate is no longer active. Review your selection.":
     result.message??tpoTeamFormErrorMessage(result.code??"UNKNOWN","REPLY"));
    return;
   }
   changeBody("");setMarkDecision(false);setMentioned([]);setConfirmAdd(false);
   setSuccess("Sent");router.refresh();
  }catch{setError(tpoTeamFormErrorMessage("UNKNOWN","REPLY"));}
  finally{pending.current=false;setBusy(false);}
 }
 return <form onSubmit={event=>{event.preventDefault();void send();}}
  className="space-y-3 border-b border-border py-4">
  <h2 className="font-semibold text-foreground">Reply privately</h2>
  <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Message
   <Textarea required value={body} maxLength={4000} rows={4} disabled={busy}
    onChange={event=>changeBody(event.target.value)}
    onKeyDown={event=>{
     if(event.key==="Enter"&&!event.shiftKey&&!event.nativeEvent.isComposing){
      event.preventDefault();void send();
     }
    }}
    className="w-full" placeholder="Share a private team update"/>
  </label>
  {kind!=="DIRECT"&&mentionMembers.length>0?<details className="border-b border-border pb-3">
   <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">Mention teammates ({mentioned.length})</summary>
   <p className="mb-2 text-xs text-body">Adding a person outside this private conversation requires confirmation. They can then read its history.</p>
   <label className="grid gap-1 text-sm">Find teammate
    <Input type="search" value={memberSearch} disabled={busy} maxLength={100}
     onChange={event=>setMemberSearch(event.target.value)}
     placeholder="Search your placement team"/>
   </label>
   <div className="mt-2 max-h-48 overflow-y-auto" role="group" aria-label="People to mention">
    {matchingMembers.map(member=><label key={member.membershipId}
     className="flex min-h-11 items-center gap-2 border-b border-border px-2 text-sm">
     <Checkbox checked={mentioned.includes(member.membershipId)} disabled={busy}
      onChange={event=>toggleMention(member.membershipId,event.target.checked)}/>
     {member.displayName}
    </label>)}
   </div>
  </details>:null}
  <label className={"flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--lms-control-radius)] px-3 py-2 text-sm transition-colors duration-150 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary "+(markDecision?"bg-primary-subtle":"hover:bg-[var(--lms-neutral-50)]")}>
   <Checkbox checked={markDecision} disabled={busy}
    onChange={event=>{setMarkDecision(event.target.checked);sendKey.current=null;}}/>
   Mark as decision
  </label>
  {markDecision?<p role="status" className="text-xs text-muted-foreground">Will be pinned as a decision</p>:null}
  <p className="text-xs text-muted-foreground" aria-live="polite">Enter to send · Shift+Enter for a new line · {body.length}/4000</p>
  {error?<InlineNotice tone="error" message={error}/>:null}
  {success?<InlineNotice tone="success" message={success}/>:null}
  <Button type="submit" disabled={busy||!body.trim()}
   className="min-h-11 md:min-h-9">{busy?"Sending…":"Send"}</Button>
  <ConfirmDialog open={confirmAdd}
   onOpenChange={next=>{if(!busy)setConfirmAdd(next);}}
   title="Add mentioned people and send?"
   description={"These selected teammates may gain access to the private conversation and its history: "+
    mentioned.map(id=>mentionMembers.find(member=>member.membershipId===id)?.displayName||"Team member").join(", ")}
   confirmLabel="Add and send" pending={busy} confirmDisabled={!body.trim()}
   onConfirm={()=>{void send(true);}}>
   <p className="text-sm text-body">Only active same-college placement-team members may be added. Confirm before sharing existing messages.</p>
  </ConfirmDialog>
 </form>;
}
