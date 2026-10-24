"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {istDateKey,nextTpoFollowupTomorrow,type TpoCompaniesTodayRow} from
 "@/modules/placements/tpo-companies-today-model";
import styles from "./tpo-companies-today.module.css";

type RecruiterReply={
 id:string;name:string;company:string|null;subject:string;
 preview:string|null;receivedAt:string;accessEnded:boolean;
};
type Outcome="CONTACTED"|"NO_RESPONSE"|"DECLINED"|"OTHER";
const outcomes:{value:Outcome;label:string}[]=[
 {value:"CONTACTED",label:"Connected"},
 {value:"NO_RESPONSE",label:"No answer"},
 {value:"DECLINED",label:"Not interested"},
 {value:"OTHER",label:"Other"},
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
 rows,nowIso,hasMore,unreadMessages,replies,replyTotal
}:{rows:TpoCompaniesTodayRow[];nowIso:string;hasMore:boolean;unreadMessages:number|null;
  replies:RecruiterReply[];replyTotal:number|null}){
 const router=useRouter();
 const now=new Date(nowIso);
 const todayKey=istDateKey(now);
 const [day,setDay]=useState(0);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [done,setDone]=useState<string[]>([]);
 const [outcome,setOutcome]=useState<Outcome>("CONTACTED");
 const [note,setNote]=useState("");
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
     if(selected){e.preventDefault();setOutcome(selected.value);}
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
 function pick(row:TpoCompaniesTodayRow){
  setSelectedId(row.id);setOutcome("CONTACTED");setNote("");setError("");setNotice("");
 }
 function pickDay(value:number){setDay(value);setSelectedId(null);setError("");}
 async function submit(kind:"DONE"|"TOMORROW"){
  if(!current||pending||inFlight.current)return;
  if(kind==="DONE"&&!note.trim()){
   setConfirm(null);setError("Record the outcome before completing the follow-up.");return;
  }
  inFlight.current=true;setPending(true);setError("");setNotice("");
  try{
   const endpoint="/api/placements/tpo/follow-up-queue/"+encodeURIComponent(current.id)+
    (kind==="DONE"?"/complete":"/reschedule");
   const body=kind==="DONE"?
    {confirmed:true,expectedDueAt:current.dueAt,outcome,note:note.trim()}:
    {confirmed:true,expectedDueAt:current.dueAt,dueAt:nextTpoFollowupTomorrow(new Date())};
   const response=await fetch(endpoint,{
    method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
   });
   const payload=await response.json().catch(()=>null) as {error?:string}|null;
   if(!response.ok)throw new Error(payload?.error==="TPO_CRM_FOLLOWUP_ALREADY_DONE"?
    "This follow-up has changed. Refresh Today before trying again.":
    "The change was not confirmed. No success has been recorded.");
   setDone(ids=>[...ids,current.id]);
   setSelectedId(null);setNote("");setConfirm(null);
   setNotice(kind==="DONE"?"Outcome recorded. Next follow-up selected.":"Moved to tomorrow at 10:00 AM IST.");
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
   <Link className={styles.link} href="/tpo/recruiters">All recruiters ›</Link>
  </div>
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
    <div className={styles.queueHead}><strong>{day===0?"Needs your attention":"Planned follow-ups"}</strong>
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
     <h2>{current.leadName}</h2><p className={styles.sub}>{current.companyName??"Recruiter"}</p>
     <div className={styles.context}><span className={styles.eyebrow}>WHY THIS PERSON</span>
       <strong>{current.note?.trim()||"A recorded recruiter follow-up is due."}</strong></div>
     <p className={styles.sub}>Record what happened. An outcome is saved with your account and the recorded follow-up is closed together.</p>
     <fieldset className={styles.outcomes}><legend className={styles.eyebrow}>HOW DID IT GO?</legend>
      {outcomes.map(item=><button key={item.value} type="button"
       aria-pressed={outcome===item.value}
       className={outcome===item.value?styles.outcomeActive:styles.outcome}
       onClick={()=>setOutcome(item.value)} disabled={pending}>{item.label}</button>)}
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
