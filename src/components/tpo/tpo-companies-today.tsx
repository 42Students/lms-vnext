"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {istDateKey,nextTpoFollowupTomorrow,nextTpoTodayFollowupAt, type TpoTodayNextPlan,type TpoCompaniesTodayRow} from
 "@/modules/placements/tpo-companies-today-model";
import styles from "./tpo-companies-today.module.css";

type RecruiterReply={
 id:string;name:string;company:string|null;subject:string;
 preview:string|null;receivedAt:string;accessEnded:boolean;
};
type Outcome="CONTACTED"|"NO_RESPONSE"|"CALL_BACK"|"DECLINED";
const outcomes:{value:Outcome;label:string}[]=[
 {value:"CONTACTED",label:"1 Spoke to them"},
 {value:"NO_RESPONSE",label:"2 No answer"},
 {value:"CALL_BACK",label:"3 Asked to call back"},
 {value:"DECLINED",label:"4 Not interested"},
];
function when(value:string){
 return new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
 }).format(new Date(value))+" IST";
}
function dayLabel(date:Date){
 return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"short",day:"numeric",month:"short"}).format(date);
}
export function TpoCompaniesToday({
 scope,rows,nowIso,hasMore,unreadMessages,replies,replyTotal,initialFollowupId
}:{scope:"MINE"|"TEAM";rows:TpoCompaniesTodayRow[];nowIso:string;hasMore:boolean;unreadMessages:number|null;
  replies:RecruiterReply[];replyTotal:number|null;initialFollowupId?:string|undefined}){
 const router=useRouter();
 const now=new Date(nowIso);
 const todayKey=istDateKey(now);
 const [day,setDay]=useState(()=>{
  const target=rows.find(row=>row.id===initialFollowupId);
  if(!target)return 0;
  const key=istDateKey(new Date(target.dueAt));
  if(key<=todayKey)return 0;
  const offset=Array.from({length:6},(_,i)=>i+1)
   .find(i=>istDateKey(new Date(now.getTime()+i*86400000))===key);
  return offset??0;
 });
 const [selectedId,setSelectedId]=useState<string|null>(rows.some(row=>row.id===initialFollowupId)?initialFollowupId??null:null);
 const [done,setDone]=useState<string[]>([]);
 const [outcome,setOutcome]=useState<Outcome>("CONTACTED");
 const [note,setNote]=useState("");
 const [nextPlan,setNextPlan]=useState<TpoTodayNextPlan>("NONE");
 const [customLocal,setCustomLocal]=useState("");
 const [pending,setPending]=useState(false);
 const [confirm,setConfirm]=useState<"DONE"|"TOMORROW"|null>(null);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const inFlight=useRef(false);
 const active=rows.filter(row=>!done.includes(row.id));
 const dayKey=istDateKey(new Date(now.getTime()+day*86400000));
 const displayed=active.filter(row=>day===0
  ?istDateKey(new Date(row.dueAt))<=todayKey
  :istDateKey(new Date(row.dueAt))===dayKey);
 const current=displayed.find(row=>row.id===selectedId)??displayed[0]??null;
 const days=Array.from({length:7},(_,offset)=>{
  const date=new Date(now.getTime()+offset*86400000);
  const key=istDateKey(date);
  return {offset,label:dayLabel(date),
    count:active.filter(row=>offset===0
      ?istDateKey(new Date(row.dueAt))<=todayKey
      :istDateKey(new Date(row.dueAt))===key).length};
 });
 useEffect(()=>{
  function onKey(e:KeyboardEvent){
   const element=e.target as HTMLElement|null;
   if(element?.closest("input,textarea,select,[contenteditable=true],button,a")||
     e.altKey||e.metaKey||e.ctrlKey)return;
   if(e.key==="j"||e.key==="k"){
    const at=displayed.findIndex(row=>row.id===current?.id);
    const next=displayed[Math.max(0,Math.min(displayed.length-1,at+(e.key==="j"?1:-1)))];
    if(next){e.preventDefault();setSelectedId(next.id);}
   }
   if(current&&!pending&&!confirm){
    if(/^[1-4]$/.test(e.key)){
     const selected=outcomes[Number(e.key)-1];
     if(selected){e.preventDefault();setOutcome(selected.value);
       setNextPlan(selected.value==="CALL_BACK"?"TOMORROW":"NONE");}
    }else if(e.key.toLowerCase()==="t"){
     e.preventDefault();setConfirm("TOMORROW");
    }else if(e.key==="Enter"&&note.trim()){
     e.preventDefault();setConfirm("DONE");
    }
   }
  }
  document.addEventListener("keydown",onKey);
  return ()=>document.removeEventListener("keydown",onKey);
 },[displayed,current,pending,confirm,note]);
 function chooseOutcome(value:Outcome){
   setOutcome(value);
   setNextPlan(value==="CALL_BACK"?"TOMORROW":"NONE");
 }
 function pick(row:TpoCompaniesTodayRow){
  setSelectedId(row.id);setOutcome("CONTACTED");setNextPlan("NONE");setCustomLocal("");setNote("");setError("");setNotice("");
 }
 function pickDay(value:number){setDay(value);setSelectedId(null);setError("");}
 async function submit(kind:"DONE"|"TOMORROW"){
  if(!current||pending||inFlight.current)return;
  if(kind==="DONE"&&!note.trim()){
   setConfirm(null);setError("Record the outcome before completing the follow-up.");return;
  }
  const nextDueAt=nextTpoTodayFollowupAt(nextPlan,new Date(),customLocal);
  if(kind==="DONE"&&nextPlan!=="NONE"&&!nextDueAt){
   setConfirm(null);setError("Choose a valid future follow-up time before saving.");return;
  }
  if(kind==="DONE"&&nextDueAt&&!current.canContact){
   setConfirm(null);setError("This recruiter lead can no longer be scheduled for outreach.");return;
  }
  inFlight.current=true;setPending(true);setError("");setNotice("");
  try{
   const endpoint="/api/placements/tpo/follow-up-queue/"+encodeURIComponent(current.id)+
    (kind==="DONE"?"/complete":"/reschedule");
   const body=kind==="DONE"?
    {confirmed:true,expectedDueAt:current.dueAt,outcome,note:note.trim(),
     ...(nextDueAt?{nextDueAt}:{})}:
    {confirmed:true,expectedDueAt:current.dueAt,dueAt:nextTpoFollowupTomorrow(new Date())};
   const response=await fetch(endpoint,{
    method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
   });
   const payload=await response.json().catch(()=>null) as {error?:string;followup?:{id?:string;done?:boolean;nextFollowupId?:string;dueAt?:string}}|null;
   if(!response.ok)throw new Error(payload?.error==="TPO_CRM_FOLLOWUP_ALREADY_DONE"?
    "This follow-up has changed. Refresh Today before trying again.":
    "The change was not confirmed. No success has been recorded.");
   if(kind==="DONE"&&(payload?.followup?.done!==true||
       (nextDueAt&&!payload?.followup?.nextFollowupId)))
    throw new Error("The complete outcome and new follow-up receipt could not be confirmed. Refresh before retrying.");
   if(kind==="TOMORROW"&&!payload?.followup?.dueAt)
    throw new Error("The changed follow-up time could not be confirmed. Refresh before retrying.");
   setDone(ids=>[...ids,current.id]);
   setSelectedId(null);setNote("");setNextPlan("NONE");setCustomLocal("");setConfirm(null);
   setNotice(kind==="DONE"?(nextDueAt?"Outcome and next follow-up saved together.":"Outcome recorded. Next follow-up selected."):"Moved to tomorrow at 10:00 AM IST.");
   router.refresh();
  }catch(e){setConfirm(null);setError(e instanceof Error?e.message:"Could not save the change.");}
  finally{inFlight.current=false;setPending(false);}
 }
 const contact=current?.canContact&&current.phoneNorm&&/^\+?[1-9]\d{7,14}$/.test(current.phoneNorm)
  ?"tel:"+(current.phoneNorm.startsWith("+")?current.phoneNorm:"+"+current.phoneNorm):null;
 return <div className={styles.root} data-testid="tpo.companies.today">
  <div className={styles.top}>
   <div><p className={styles.eyebrow}>COMPANIES · TODAY</p>
    <h1>Today</h1>
    <p className={styles.sub}>Reply to recruiters and finish your next follow-ups, one at a time.</p>
   </div>
   <nav aria-label="Today layouts" className="flex flex-wrap items-center gap-3">
    <Link className={styles.link} href={"/tpo/companies/today"+(scope==="TEAM"?"?scope=TEAM&":"?")+"view=agenda"}>Agenda</Link>
    <Link className={styles.link} href={"/tpo/companies/today"+(scope==="TEAM"?"?scope=TEAM&":"?")+"view=brief"}>Brief</Link>
    <Link className={styles.link} href="/tpo/recruiters">All recruiters ›</Link>
   </nav>
  </div>
  <nav aria-label="Today ownership" className="flex flex-wrap items-center gap-2">
    {([["MINE","My Work"],["TEAM","Everyone"]] as const).map(([value,label])=>
      <Link key={value} href={value==="MINE"?"/tpo/companies/today":"/tpo/companies/today?scope=TEAM"}
        aria-current={scope===value?"page":undefined}
        className="inline-flex min-h-11 items-center rounded-lg border border-[#d6e1ee] bg-white px-4 text-[13px] font-bold text-[#3b4a60] aria-[current=page]:border-[#0a7c88] aria-[current=page]:bg-[#eff8fa] aria-[current=page]:text-[#0a7c88]">
        {label}
      </Link>)}
    <span className={styles.sub}>{scope==="MINE"?
      "Your follow-ups and unassigned work from this college.":
      "Open follow-ups from your college's placement team."}</span>
  </nav>
  {replyTotal!==null&&replyTotal>0?<section className={styles.answer} aria-label="Recruiter replies waiting" data-testid="tpo.today.replies">
    <div className={styles.replyHead}>
     <strong>Answer · {replyTotal} recruiter {replyTotal===1?"reply":"replies"} waiting</strong>
     <Link href="/tpo/messages?tab=recruiters&status=REPLY">All replies in Messages ›</Link>
    </div>
    <div className={styles.replyList}>
     {replies.map(item=><article key={item.id} className={styles.reply}>
      <span className={styles.replyWho}><strong>{item.name}</strong>
       <small>{item.company??"Recruiter"} · {item.subject} · {when(item.receivedAt)}</small>
      </span>
      {item.preview?<span className={styles.replyPreview}>{item.preview}</span>:null}
      <Link href={"/tpo/messages?tab=recruiters&thread="+encodeURIComponent(item.id)}
        className={styles.replyAction}>{item.accessEnded?"Open history":"Answer"}</Link>
     </article>)}
    </div>
    {replyTotal>replies.length?<p className={styles.sub}>Showing the newest {replies.length} recruiter conversations. Open Messages for the rest.</p>:null}
   </section>:null}
  {replyTotal===null?<p className={styles.warning} role="status">Recruiter reply preview is temporarily unavailable. Open Messages to check the inbox.</p>:null}
  {unreadMessages!==null&&unreadMessages>0?<div className={styles.answer}>
   <strong>Answer · {unreadMessages} unread recruiter {unreadMessages===1?"message":"messages"}</strong>
   <Link href="/tpo/messages?tab=recruiters">Open Messages ›</Link>
  </div>:null}
  {error?<p role="alert" className={styles.error}>{error}</p>:null}
  {notice?<p role="status" className={styles.success}>{notice}</p>:null}
  {hasMore?<p role="status" className={styles.warning}>This is a 50-item focus preview from the first CRM pages. Older follow-ups are available in the full queue.</p>:null}
  <div className={styles.grid}>
   <section className={styles.queue} aria-label="Follow-up queue">
    <div className={styles.queueHead}>
     <div className={styles.queueTitle}>
      <span className={styles.eyebrow}>{day===0?"TODAY · ": "PLANNED · "}{dayLabel(new Date(now.getTime()+day*86400000)).toUpperCase()}</span>
      <strong>{displayed.length} {displayed.length===1?"thing":"things"} need you</strong>
      <small>{scope==="MINE"?"Yours and unassigned":"Your placement team's open follow-ups"}</small>
     </div>
     <Link href="/tpo/follow-ups">Re-plan your week ›</Link></div>
    <div className={styles.week} role="group" aria-label="This week">
     {days.map(item=><button type="button" key={item.offset}
       aria-pressed={day===item.offset}
       className={day===item.offset?styles.chosen:styles.day}
       onClick={()=>pickDay(item.offset)}>
       <span>{item.label}</span><strong>{item.count}</strong></button>)}
    </div>
    {displayed.length?<div role="listbox" aria-label="People needing a follow-up">
     {displayed.map(row=><button key={row.id} type="button" role="option"
      aria-selected={current?.id===row.id} className={styles.item}
      onClick={()=>pick(row)}>
      <span className={row.overdue?styles.red:styles.teal} aria-hidden="true"/>
      <span><strong>{row.leadName}</strong>
       <small>{row.companyName??"Recruiter"} · {row.overdue?"Overdue":"Follow-up due"}</small>
       <small>{when(row.dueAt)}</small></span>
     </button>)}</div>:
     <div className={styles.empty}>No open, recorded follow-ups in this date window.
      <Link href="/tpo/follow-ups">Check the full follow-up queue</Link></div>}
    <footer className={styles.foot}>J / K to choose · 1–4 outcome · T tomorrow · Enter to review Done · {displayed.length} shown
     {hasMore?" · more exist":""}</footer>
   </section>
   <section className={styles.detail} aria-label="Selected">
    {current?<><span className={styles.eyebrow}>{current.overdue?"OVERDUE · ":"DUE · "}{when(current.dueAt)}</span>
     <div className={styles.personHead}>
      <div><h2>{current.leadName}</h2><p className={styles.sub}>{current.companyName??"Recruiter"}</p></div>
      <div className={styles.personActions}>
       {contact?<a href={contact} className={styles.secondary}>Call</a>:null}
       <Link href={"/tpo/recruiters/"+encodeURIComponent(current.leadId)} className={styles.secondary}>Open page</Link>
      </div>
     </div>
     <div className={styles.context}><span className={styles.eyebrow}>WHY THIS PERSON</span>
       <strong>{current.note?.trim()||"A recorded recruiter follow-up is due."}</strong></div>
     <p className={styles.sub}>Record what happened. An outcome is saved with your account and the recorded follow-up is closed together.</p>
     <fieldset className={styles.outcomes}><legend className={styles.eyebrow}>HOW DID IT GO?</legend>
      {outcomes.map(item=><button key={item.value} type="button"
       aria-pressed={outcome===item.value}
       className={outcome===item.value?styles.outcomeActive:styles.outcome}
       onClick={()=>chooseOutcome(item.value)} disabled={pending}>{item.label}</button>)}
     </fieldset>
     <fieldset className={styles.outcomes}>
       <legend className={styles.eyebrow}>WHEN SHOULD YOU FOLLOW UP?</legend>
       {([["NONE","No next follow-up"],["TOMORROW","Tomorrow · 10 AM"],
          ["WEEK","In 7 days · 10 AM"],["CUSTOM","Pick a date"]] as const).map(([value,label])=>
         <button type="button" key={value} disabled={pending||(!current.canContact&&value!=="NONE")}
          aria-pressed={nextPlan===value}
          className={nextPlan===value?styles.outcomeActive:styles.outcome}
          onClick={()=>setNextPlan(value)}>{label}</button>)}
       {nextPlan==="CUSTOM"?<label className={styles.noteLabel}>Follow up at (IST)
          <input type="datetime-local" value={customLocal} disabled={pending}
           onChange={event=>setCustomLocal(event.target.value)}
           className="min-h-11 rounded-lg border border-[#d6e1ee] bg-white p-2 text-[14px]"/>
         </label>:null}
       {!current.canContact?<p className={styles.sub}>Further outreach to this contact is unavailable under current CRM rules.</p>:null}
     </fieldset>
     <label className={styles.noteLabel}>Outcome note (required)
       <textarea maxLength={500} rows={4} value={note} disabled={pending}
         onChange={e=>setNote(e.target.value)}
         placeholder="What happened? This is saved in the recruiter history."/>
     </label>
     <div className={styles.actions}>
      <button type="button" disabled={pending||!note.trim()} className={styles.primary}
       onClick={()=>setConfirm("DONE")}>Done & next</button>
      <button type="button" disabled={pending} className={styles.secondary}
       onClick={()=>setConfirm("TOMORROW")}>Tomorrow, 10 AM</button>
      {contact?<a href={contact} className={styles.secondary}>Call recruiter ↗</a>:null}
     </div>
     <Link className={styles.link} href={"/tpo/recruiters/"+encodeURIComponent(current.leadId)}>
       Open full recruiter history ›
     </Link>
    </>:<div className={styles.empty}>Choose a recorded follow-up from the queue.
      <Link href="/tpo/recruiters">Browse recruiters ›</Link>
     </div>}
   </section>
  </div>
  <ConfirmDialog open={confirm!==null} onOpenChange={value=>{if(!value&&!pending)setConfirm(null);}}
   title={confirm==="DONE"?"Record this outcome and finish the follow-up?":
    "Move this follow-up to tomorrow at 10 AM IST?"}
   confirmLabel={confirm==="DONE"?"Confirm Done & next":"Confirm Tomorrow"}
   pending={pending} onConfirm={()=>{if(confirm)void submit(confirm);}}>
    <p className={styles.sub}>Only the selected follow-up is changed. If another team member changed it, the action is rejected.</p>
  </ConfirmDialog>
 </div>;
}
