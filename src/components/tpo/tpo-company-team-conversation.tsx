"use client";
import {ScrollCue} from "@/components/ui/scroll-cue";
import {useCallback,useEffect,useRef,useState,type FormEvent} from "react";
import Link from "next/link";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {driveDeadlineIstToIso} from "@/modules/placements/tpo-drive-deadline-ist";

type TeamMessage={
 id:string;body:string;decision:boolean;authorMembershipId:string;authorName:string|null;
 createdLabel:string;dayLabel:string;dayKey:string;askOverdue:boolean;dueLabel:string|null;editedAt:string|null;deletedAt:string|null;
 askAssigneeMembershipId:string|null;askStatus:string|null;
};
type TeamPayload={
 status:"READY"|"NOT_REGISTERED";companyName:string;messages:TeamMessage[];
 members:{membershipId:string;name:string|null}[];following:boolean;truncated:boolean;
};
function errorMessage(code:string){
 return ({NOT_FOUND:"Company conversation not found in this college.",
 STORAGE_PENDING:"Company Team conversation storage has not been registered.",
 NOT_AUTHORIZED:"Only the responsible team member can change this.",
 STALE:"This message or ask changed. Reload before trying again."} as Record<string,string>)[code]??
  "Team conversation could not be updated. Retry.";
}
function formatTokens(body:string,members:TeamPayload["members"]){
 return body.split(/(@team|@member:[0-9a-f-]{36}|#(?:drive|company|student):[0-9a-f-]{36})/gi)
  .map((chunk,i)=>{
    if(chunk.startsWith("@member:")){
      const name=members.find(m=>m.membershipId.toLowerCase()===chunk.slice(8).toLowerCase())?.name;
      return <span key={i} className="rounded bg-primary-subtle px-1 font-semibold">@{name??"team member"}</span>;
    }
    if(chunk.startsWith("#drive:"))return <Link key={i} className="text-primary-text underline"
      href={"/tpo/placements/jobs/"+encodeURIComponent(chunk.slice(7))}>{chunk}</Link>;
    if(chunk.startsWith("#company:"))return <Link key={i} className="text-primary-text underline"
      href={"/tpo/companies/"+encodeURIComponent(chunk.slice(9))}>{chunk}</Link>;
    if(chunk.startsWith("#student:"))return <Link key={i} className="text-primary-text underline"
      href={"/tpo/students/"+encodeURIComponent(chunk.slice(9))+"/participation"}>{chunk}</Link>;
    if(chunk.startsWith("@")||chunk.startsWith("#"))
      return <span key={i} className="rounded bg-primary-subtle px-1 font-semibold">{chunk}</span>;
    return chunk;
  });
}
/** TPO-companies-05: internal college team only; read operations are authorized server side. */
export function TpoCompanyTeamConversation({companyId,companyName,actorMembershipId}:{
 companyId:string;companyName:string;actorMembershipId:string;
}){
 const [data,setData]=useState<TeamPayload|null>(null);
 const [error,setError]=useState("");
 const [body,setBody]=useState("");
 const [busy,setBusy]=useState(false);
 const pending=useRef(false);
 const sendKey=useRef<{fingerprint:string;key:string}|null>(null);
 const [decision,setDecision]=useState(false);
 const [assignee,setAssignee]=useState("");
 const [dueAt,setDueAt]=useState("");
 const [editing,setEditing]=useState<string|null>(null);
 const [editBody,setEditBody]=useState("");
 const [deleting,setDeleting]=useState<string|null>(null);
 const url="/api/placements/tpo/company-team/"+encodeURIComponent(companyId);
 const load=useCallback(async()=>{
  try{
   const response=await fetch(url,{cache:"no-store",credentials:"same-origin"});
   const payload=await response.json() as TeamPayload&{error?:string};
   if(!response.ok)throw new Error(errorMessage(payload.error??"UNKNOWN"));
   setData(payload);setError("");
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not load Team.");}
 },[url]);
 useEffect(()=>{
  void load();
  const refresh=window.setInterval(()=>{if(document.visibilityState==="visible")void load();},30000);
  const focus=()=>void load();
  window.addEventListener("focus",focus);
  return ()=>{window.clearInterval(refresh);window.removeEventListener("focus",focus);};
 },[load]);
 async function mutate(payload:Record<string,unknown>):Promise<boolean>{
  if(pending.current||busy)return false;
  pending.current=true;setBusy(true);setError("");
  try{
   const response=await fetch(url,{method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   if(!response.ok){
    const failure=await response.json().catch(()=>null) as {error?:string}|null;
    throw new Error(errorMessage(failure?.error??"UNKNOWN"));
   }
   await load();return true;
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not save Team changes.");return false;}
  finally{pending.current=false;setBusy(false);}
 }
 async function send(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!body.trim()||busy)return;
  let due:string|null=null;
  try{due=dueAt?driveDeadlineIstToIso(dueAt):null;}
  catch{setError("Enter a valid IST due date.");return;}
  const fingerprint=JSON.stringify([body.trim(),decision,assignee||null,due]);
  // Keep the same key after a lost response. Edits to the unsent content
  // create a different key so the server never replays an unrelated message.
  if(sendKey.current?.fingerprint!==fingerprint)
    sendKey.current={fingerprint,key:crypto.randomUUID()};
  const ok=await mutate({action:"SEND",body:body.trim(),decision,
   assigneeId:assignee||null,dueAt:due,idempotencyKey:sendKey.current.key});
  if(ok){sendKey.current=null;setBody("");setDecision(false);setAssignee("");setDueAt("");}
 }
 return <section aria-label={"Company Team conversation for "+companyName}
   className="space-y-4 rounded-xl border border-border bg-surface p-4">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div>
    <h2 className="font-semibold text-foreground">Team · {companyName}</h2>
    <p className="mt-1 text-xs text-body">
     Only your placement team sees this. Recruiters and students never do.
    </p>
   </div>
   <div className="flex flex-wrap items-center gap-3 text-sm">
    {data?.status==="READY"?<button type="button" disabled={busy}
      className="font-semibold text-primary-text underline"
      onClick={()=>void mutate({action:"FOLLOW",following:!data.following})}>
      {data.following?"Following":"Follow"}
    </button>:null}
    <Link href={"/tpo/team/company/"+encodeURIComponent(companyId)}
      className="font-semibold text-primary-text underline">Open in Team</Link>
   </div>
  </div>
  {error?<p role="alert" className="text-sm text-danger">{error} <button className="font-semibold underline"
    type="button" onClick={()=>void load()}>Retry</button></p>:null}
  {!data&&!error?<p role="status" className="text-sm text-body">Loading company Team conversation…</p>:null}
  {data?.status==="NOT_REGISTERED"?<p role="status" className="text-sm text-body">
    Company Team messages are unavailable until the database migration is registered. No messages have been fabricated.
  </p>:null}
  {data?.status==="READY"?<>
   {data.truncated?<p role="status" className="text-xs text-warning">Showing the latest 100 messages. Earlier history remains stored.</p>:null}
   {data.messages.some(m=>m.decision&&!m.deletedAt)?<aside aria-label="Pinned company Team decisions"
     className="rounded-lg border border-border p-3 text-sm">
     <h3 className="font-semibold">Decided:</h3>
     {data.messages.filter(m=>m.decision&&!m.deletedAt).slice(-5).map(m=>
       <a key={m.id} href={"#company-team-"+m.id} className="block truncate text-primary-text underline">{m.body}</a>)}
   </aside>:null}
   <ScrollCue axis="y" label="Company Team message history" viewportClassName="max-h-[35rem]"><ol role="log" aria-live="polite" aria-label="Company Team messages" className="space-y-3">
    {data.messages.length===0?<li className="text-sm text-muted-foreground">
      Nothing here yet. Write the first message. @ someone to bring them in, or Ask someone to give a task a name and a date.
    </li>:data.messages.map((m,index)=><li key={m.id} id={"company-team-"+m.id} className="rounded-md border border-border p-3">
      {(index===0||data.messages[index-1].dayKey!==m.dayKey)?<p className="mb-2 text-center text-xs font-semibold text-body">{m.dayLabel}</p>:null}
      <p className="text-xs text-muted-foreground">
        {m.authorMembershipId===actorMembershipId?"You":m.authorName??"Team member"} · {m.createdLabel}
        {m.editedAt?" · edited":""}
      </p>
      {m.decision&&!m.deletedAt?<strong className="text-xs text-success">Decision</strong>:null}
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-body">
       {m.deletedAt?"Message removed":formatTokens(m.body,data.members)}
      </p>
      {m.askAssigneeMembershipId?<div className="mt-2 rounded border border-border p-2 text-xs">
        {m.askOverdue?"Overdue ask":"Open ask"} · {data.members.find(person=>person.membershipId===m.askAssigneeMembershipId)?.name??"Team member"}
        {m.dueLabel?" · by "+m.dueLabel:""} · {m.askStatus??"OPEN"}
        {m.askStatus==="OPEN"&&m.askAssigneeMembershipId===actorMembershipId?
         <button className="ml-2 font-semibold text-primary-text underline" type="button" disabled={busy}
           onClick={()=>void mutate({action:"ASK_DONE",messageId:m.id})}>Mark done</button>:null}
        {m.askStatus==="OPEN"&&m.authorMembershipId===actorMembershipId?
         <button className="ml-2 font-semibold text-primary-text underline" type="button" disabled={busy}
           onClick={()=>void mutate({action:"ASK_CANCEL",messageId:m.id})}>Cancel ask</button>:null}
       </div>:null}
       {!m.deletedAt?<div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
         <button type="button" disabled={busy} className="font-semibold text-primary-text underline"
           onClick={()=>void mutate({action:"DECISION",messageId:m.id,marked:!m.decision})}>
           {m.decision?"Take the decision mark off":"Mark as decision"}</button>
         {m.authorMembershipId===actorMembershipId?<>
           <button type="button" className="text-primary-text underline"
             onClick={()=>{setEditing(m.id);setEditBody(m.body);}}>Edit (within 15 minutes)</button>
           <button type="button" className="text-primary-text underline"
             onClick={()=>setDeleting(m.id)}>Delete</button>
         </>:null}
       </div>:null}
       {editing===m.id?<form className="mt-2 space-y-2" onSubmit={event=>{event.preventDefault();
          void mutate({action:"EDIT",messageId:m.id,body:editBody}).then(ok=>{if(ok)setEditing(null);});}}>
        <textarea required maxLength={4000} rows={3} className="w-full rounded border border-border p-2"
          value={editBody} onChange={event=>setEditBody(event.target.value)}/>
        <button type="submit" disabled={busy||!editBody.trim()} className="text-primary-text underline">Save edit</button>
        <button type="button" className="ml-3 text-primary-text underline" onClick={()=>setEditing(null)}>Cancel</button>
       </form>:null}
    </li>)}
   </ol></ScrollCue>
   <form onSubmit={event=>void send(event)} className="grid gap-3">
    <label className="grid gap-1 text-sm font-semibold text-body">
     Write to the team. @ to mention, # to link a drive, company or student.
     <textarea required maxLength={4000} rows={3} value={body} disabled={busy}
       onChange={event=>setBody(event.target.value)}
       onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey&&!event.nativeEvent.isComposing){
        event.preventDefault();event.currentTarget.form?.requestSubmit();
       }}}
       className="rounded border border-border bg-surface p-3"/>
    </label>
    <label className="grid gap-1 text-sm">Mention a teammate
      <select disabled={busy} defaultValue="" className="min-h-10 rounded border border-border bg-surface px-2"
        onChange={event=>{if(event.target.value){
          setBody(current=>(current.trimEnd()+" @member:"+event.target.value+" ").slice(0,4000));
          event.currentTarget.value="";
        }}}>
        <option value="">Choose a colleague to @mention</option>
        {data.members.filter(m=>m.membershipId!==actorMembershipId).map(m=>
          <option key={m.membershipId} value={m.membershipId}>{m.name}</option>)}
      </select>
    </label>
    <p className="text-xs text-muted-foreground">Use @team to notify the placement team or #drive:&lt;UUID&gt; and #company:&lt;UUID&gt; to link authorized records.</p>
    <div className="grid gap-3 sm:grid-cols-2">
     <label className="grid gap-1 text-sm">Ask someone (optional)
       <select value={assignee} disabled={busy} onChange={event=>setAssignee(event.target.value)}
        className="min-h-10 rounded border border-border bg-surface px-2">
        <option value="">No ask attached</option>
        {data.members.filter(member=>member.membershipId!==actorMembershipId).map(member=>
         <option key={member.membershipId} value={member.membershipId}>{member.name}</option>)}
       </select>
     </label>
     {assignee?<label className="grid gap-1 text-sm">By (IST, optional)
       <input type="datetime-local" value={dueAt} onChange={event=>setDueAt(event.target.value)}
        className="min-h-10 rounded border border-border bg-surface px-2"/>
     </label>:null}
    </div>
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={decision} disabled={busy} onChange={event=>setDecision(event.target.checked)}/>
      Mark as decision
    </label>
    <div className="flex items-center justify-between gap-3">
     <span className="text-xs text-muted-foreground">{body.length}/4000</span>
     <button type="submit" disabled={busy||!body.trim()}
      className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
       {busy?"Sending…":"Send"}
     </button>
    </div>
   </form>
   <ConfirmDialog open={deleting!==null} onOpenChange={open=>{if(!open)setDeleting(null);}}
     title="Delete this message?" description="Its ask is cancelled too. It shows as Message removed."
     pending={busy} confirmLabel="Delete message" onConfirm={()=>{
      const messageId=deleting;if(messageId)void mutate({action:"DELETE",messageId}).then(ok=>{if(ok)setDeleting(null);});
     }}/>
  </>:null}
 </section>;
}
