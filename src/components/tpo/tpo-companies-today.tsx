"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {istDateKey,nextTpoFollowupTomorrow,nextTpoTodayFollowupAt, type TpoTodayNextPlan,type TpoCompaniesTodayRow} from
 "@/modules/placements/tpo-companies-today-model";
import styles from "./tpo-companies-today.module.css";

type LeadContext={id:string;stage:string;designation:string|null;emailNorm:string|null;ownerName:string|null};
type CompanyAttention={items:Array<{
 relationshipId:string;companyId:string;companyName:string;
 collegeTrusted:boolean;recruiterId:string;recruiterName:string;
}>;hasMore:boolean};
type RecruiterReply={
 id:string;name:string;company:string|null;subject:string;
 preview:string|null;receivedAt:string;accessEnded:boolean;
};
type FocusItem=
 |{key:string;kind:"company";company:CompanyAttention["items"][number]}
 |{key:string;kind:"reply";reply:RecruiterReply}
 |{key:string;kind:"followup";row:TpoCompaniesTodayRow};
type OutsideWeek={withoutDate:number;laterThanWeek:number};
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
 scope,rows,nowIso,hasMore,unreadMessages,replies,replyTotal,initialFollowupId,notContacted,leadContexts,companyAttention,outsideWeek=null
}:{scope:"MINE"|"TEAM";rows:TpoCompaniesTodayRow[];nowIso:string;hasMore:boolean;unreadMessages:number|null;
  replies:RecruiterReply[];replyTotal:number|null;initialFollowupId?:string|undefined;leadContexts:LeadContext[];companyAttention:CompanyAttention|null;
  outsideWeek?:OutsideWeek|null;
  notContacted:{count:number;oldestAddedAt:string|null}|null}){
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
 const [selectedKey,setSelectedKey]=useState<string|null>(rows.some(row=>row.id===initialFollowupId)?"followup:"+initialFollowupId:null);
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
 // One selectable queue across three independent, college-scoped sources.
 const focusItems:FocusItem[]=day===0?[
  ...(companyAttention?.items??[]).map(company=>({key:"company:"+company.relationshipId,kind:"company" as const,company})),
  ...replies.map(reply=>({key:"reply:"+reply.id,kind:"reply" as const,reply})),
  ...displayed.map(row=>({key:"followup:"+row.id,kind:"followup" as const,row})),
 ]:displayed.map(row=>({key:"followup:"+row.id,kind:"followup" as const,row}));
 const selected=focusItems.find(item=>item.key===selectedKey)??focusItems[0]??null;
 const current=selected?.kind==="followup"?selected.row:null;
 const selectedCompany=selected?.kind==="company"?selected.company:null;
 const selectedReply=selected?.kind==="reply"?selected.reply:null;
 const totalAttention=displayed.length+(day===0?(replyTotal??replies.length)+(companyAttention?.items.length??0):0);
 const attentionIncomplete=hasMore||(day===0&&(replyTotal===null||replyTotal>replies.length||companyAttention===null||companyAttention.hasMore));
 const leadInfo=current?leadContexts.find(lead=>lead.id===current.leadId):undefined;
 const email=current?.canContact?leadInfo?.emailNorm?.trim():null;
 const emailHref=email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?"mailto:"+email:null;
 const days=Array.from({length:7},(_,offset)=>{
  const date=new Date(now.getTime()+offset*86400000);
  const key=istDateKey(date);
  return {offset,label:dayLabel(date),
    weekday:new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"short"}).format(date),
    dayNumber:new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric"}).format(date),
    count:active.filter(row=>offset===0
      ?istDateKey(new Date(row.dueAt))<=todayKey
      :istDateKey(new Date(row.dueAt))===key).length+
      (offset===0?(replyTotal??replies.length)+(companyAttention?.items.length??0):0)};
 });
 useEffect(()=>{
  function onKey(e:KeyboardEvent){
   const element=e.target as HTMLElement|null;
   if(element?.closest("input,textarea,select,[contenteditable=true],button,a")||
     e.altKey||e.metaKey||e.ctrlKey)return;
   if(!pending&&(e.key==="j"||e.key==="k")){
    const at=focusItems.findIndex(item=>item.key===selected?.key);
    const next=focusItems[Math.max(0,Math.min(focusItems.length-1,at+(e.key==="j"?1:-1)))];
    if(next){e.preventDefault();pickKey(next.key);}
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
 },[focusItems,selected,current,pending,confirm,note]);
 function chooseOutcome(value:Outcome){
   setOutcome(value);
   setNextPlan(value==="CALL_BACK"?"TOMORROW":"NONE");
 }
 function pickKey(key:string){
  if(pending||inFlight.current)return;
  setSelectedKey(key);setOutcome("CONTACTED");setNextPlan("NONE");setCustomLocal("");
  setNote("");setError("");setNotice("");
 }
 function pickDay(value:number){if(pending||inFlight.current)return;setDay(value);setSelectedKey(null);setError("");setNotice("");}
 function laterAndNext(){
  if(!selected)return;
  const index=focusItems.findIndex(item=>item.key===selected.key);
  const next=focusItems[index+1];
  if(next){pickKey(next.key);setNotice("Opened the next item. The previous item was left unchanged.");}
  else setNotice("This is the last loaded item for the day. Nothing was changed.");
 }
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
   const at=focusItems.findIndex(item=>item.key==="followup:"+current.id);
   const nextItem=focusItems[at+1]??focusItems[at-1]??null;
   setDone(ids=>[...ids,current.id]);
   setSelectedKey(nextItem?.key??null);setNote("");setNextPlan("NONE");setCustomLocal("");setConfirm(null);
   setNotice(kind==="DONE"?(nextDueAt?"Outcome and next follow-up saved together.":"Outcome recorded. Next follow-up selected."):"Moved to tomorrow at 10:00 AM IST.");
   router.refresh();
  }catch(e){setConfirm(null);setError(e instanceof Error?e.message:"Could not save the change.");}
  finally{inFlight.current=false;setPending(false);}
 }
 const contact=current?.canContact&&current.phoneNorm&&/^\+?[1-9]\d{7,14}$/.test(current.phoneNorm)
  ?"tel:"+(current.phoneNorm.startsWith("+")?current.phoneNorm:"+"+current.phoneNorm):null;
 return <div className={styles.root} data-testid="tpo.companies.today">
  <nav className={styles.viewLinks} aria-label="Today views">
   <span className={styles.eyebrow}>TODAY · RECRUITER FOCUS</span>
   <Link href={"/tpo/companies/today"+(scope==="TEAM"?"?scope=TEAM&":"?")+"view=agenda"}>Agenda</Link>
   <Link href={"/tpo/companies/today"+(scope==="TEAM"?"?scope=TEAM&":"?")+"view=brief"}>Brief</Link>
  </nav>
  {error?<p role="alert" className={styles.error}>{error}</p>:null}
  {notice?<p role="status" className={styles.success}>{notice}</p>:null}
  {hasMore?<p role="status" className={styles.warning}>This is a bounded focus preview from the first CRM pages. Older follow-ups are available in the full queue.</p>:null}
  <div className={styles.grid}>
   <section className={styles.queue} aria-label="What needs you">
    <div className={styles.queueHead}>
     <div className={styles.queueTitle}>
      <span className={styles.eyebrow}>{day===0?"TODAY · ": "PLANNED · "}{dayLabel(new Date(now.getTime()+day*86400000)).toUpperCase()}</span>
      <strong>{attentionIncomplete?"At least ":""}{totalAttention} {totalAttention===1?"thing needs":"things need"} you</strong>
      <small>{scope==="MINE"?"Yours and unassigned":"Everyone's work"} · <Link href={scope==="MINE"?"/tpo/companies/today?scope=TEAM":"/tpo/companies/today"}>{scope==="MINE"?"everyone's":"my work"}</Link></small>
     </div>
     <Link href="/tpo/follow-ups">Re-plan your week ›</Link></div>
    <div className={styles.week} role="group" aria-label="This week">
     {days.map(item=><button type="button" key={item.offset}
       aria-pressed={day===item.offset}
       className={day===item.offset?styles.chosen:styles.day}
       onClick={()=>pickDay(item.offset)}>
       <span>{item.weekday.toUpperCase()}</span><strong>{item.dayNumber}</strong><small>{item.count||"·"}</small></button>)}
    </div>
    {day===0&&companyAttention===null?<p role="status" className={styles.helper}>Company verification attention is unavailable. A missing source does not mean every company is verified.</p>:null}
    {day===0&&replyTotal===null?<p role="status" className={styles.helper}>Recruiter replies are temporarily unavailable. Open Messages for the current inbox.</p>:null}
    {day===0&&companyAttention?.hasMore?<p role="status" className={styles.helper}>More companies need review than this preview can show. <Link href="/tpo/companies?directory=1">Open the company directory</Link>.</p>:null}
    {day===0&&replyTotal!==null&&replyTotal>replies.length?<p role="status" className={styles.helper}>Showing {replies.length} of {replyTotal} waiting replies. <Link href="/tpo/messages?tab=recruiters&status=REPLY">See all replies</Link>.</p>:null}
    {focusItems.length?<div role="listbox" aria-label="Today's company and recruiter work">
     {focusItems.map(item=>{
      const isCompany=item.kind==="company";
      const isReply=item.kind==="reply";
      const name=isCompany?item.company.recruiterName:isReply?item.reply.name:item.row.leadName;
      const description=isCompany?"Company not verified · "+item.company.companyName:
       isReply?"Replied to your message · "+(item.reply.company??"Recruiter"):
       (item.row.companyName??"Recruiter")+" · "+(item.row.overdue?"Overdue":"Follow-up due");
      const detail=isCompany?"Review company trust and verification":isReply?
       item.reply.subject:item.row.note?.trim()||"Open the recorded follow-up";
      const stamp=isCompany?"Needs review":isReply?when(item.reply.receivedAt):when(item.row.dueAt);
      const urgent=!isCompany&&!isReply&&istDateKey(new Date(item.row.dueAt))<todayKey;
      return <button type="button" key={item.key} role="option"
       aria-selected={selected?.key===item.key} className={styles.item}
       onClick={()=>pickKey(item.key)}>
       <span className={urgent?styles.red:isReply?styles.replyDot:styles.teal} aria-hidden="true"/>
       <span><strong>{name}</strong>
        <small>{description}</small>
        <small>{detail}</small>
        <small>{stamp}</small>
       </span>
      </button>;
     })}</div>:
     <div className={styles.empty}>No recorded work in this date window.
      <Link href="/tpo/follow-ups">Check the full follow-up queue</Link>
     </div>}
    <div className="flex flex-col gap-1 border-t border-[#e7ecf2] bg-[#f8fafb] px-4 py-3 text-[13px]">
     {notContacted===null?<span role="status" className="text-[#617084]">Not-contacted recruiter count unavailable.</span>:
      <Link href="/tpo/recruiters?stage=NEW" className="font-bold text-[#087f8b]">
       {notContacted.count} not contacted yet · start with them
      </Link>}
     {outsideWeek?<span className="text-[#087f8b]">
      <Link href="/tpo/recruiters?nextFollowup=NONE">{outsideWeek.withoutDate} with no date</Link>
      {" · "}
      <Link href="/tpo/recruiters?nextFollowup=LATER">{outsideWeek.laterThanWeek} later than this week</Link>
      {" · "}
      <Link href="/tpo/follow-ups">Re-plan your week</Link>
     </span>:<Link href="/tpo/follow-ups" className="text-[#087f8b]">Re-plan your week</Link>}
    </div>
    <footer className={styles.foot}>J / K to move · T tomorrow and Enter to review Done for follow-ups · {focusItems.length} shown
     {attentionIncomplete?" · more may exist":""}</footer>
   </section>
   <section className={styles.detail} aria-label="Selected">
    {selectedCompany?<div className={styles.companyDetail} data-testid="tpo.today.company-detail">
     <div className={styles.personHead}>
      <div className={styles.identity}>
       <div className={styles.avatar} aria-hidden="true">{selectedCompany.recruiterName.trim().split(/\s+/).slice(0,2).map(part=>part[0]?.toUpperCase()??"").join("")}</div>
       <div><h2>{selectedCompany.recruiterName}</h2>
        <p className={styles.sub}>{selectedCompany.companyName} · Recruiter account linked</p></div>
      </div>
      <div className={styles.personActions}>
       <Link href={"/tpo/recruiters/"+encodeURIComponent(selectedCompany.recruiterId)} className={styles.secondary}>Open recruiter</Link>
       <Link href={"/tpo/companies/"+encodeURIComponent(selectedCompany.companyId)} className={styles.secondary}>Open company</Link>
      </div>
     </div>
     <div className={styles.context}>
      <span className={styles.eyebrow}>COMPANY IDENTITY · NOT VERIFIED</span>
      <strong>{selectedCompany.companyName} is not yet platform-verified. {selectedCompany.collegeTrusted?"College trust is already enabled; check the verification and publishing conditions.":"Review the company before deciding whether to trust it for your college."}</strong>
     </div>
     <p className={styles.sub}>A linked recruiter account is not proof of company identity. Platform verification and this college's trust decision are separate.</p>
     <div className={styles.facts}>
      <div><span className={styles.eyebrow}>PLATFORM VERIFICATION</span><p>Not verified by 42</p></div>
      <div><span className={styles.eyebrow}>COLLEGE TRUST</span><p>College trust: {selectedCompany.collegeTrusted?"Trusted":"Not trusted"}</p></div>
     </div>
     <div className={styles.actions}>
      <Link href={"/tpo/companies/"+encodeURIComponent(selectedCompany.companyId)} className={styles.primary}>Review company trust on its record</Link>
      <button type="button" onClick={laterAndNext} className={styles.secondary}>Later &amp; next</button>
     </div>
     <p className={styles.helper}>Reviewing this company does not automatically verify it or change recruiter access. Later &amp; next changes selection only.</p>
    </div>:selectedReply?<div className={styles.replyDetail} data-testid="tpo.today.reply-detail">
     <div className={styles.personHead}><div className={styles.identity}>
      <div className={styles.avatar} aria-hidden="true">{selectedReply.name.trim().split(/\s+/).slice(0,2).map(part=>part[0]?.toUpperCase()??"").join("")}</div>
      <div><h2>{selectedReply.name}</h2><p className={styles.sub}>{selectedReply.company??"Recruiter"} · {when(selectedReply.receivedAt)}</p></div>
     </div></div>
     <div className={styles.context}><span className={styles.eyebrow}>RECRUITER MESSAGE · NEEDS ANSWER</span>
      <strong>{selectedReply.subject}</strong></div>
     {selectedReply.preview?<p className={styles.replyBody}>{selectedReply.preview}</p>:
      <p className={styles.sub}>Open the conversation to read the complete message.</p>}
     {selectedReply.accessEnded?<p className={styles.warning} role="status">Recruiter access to this conversation has ended. Open history before taking any action.</p>:null}
     <div className={styles.actions}>
      <Link href={"/tpo/messages?tab=recruiters&status=REPLY&thread="+encodeURIComponent(selectedReply.id)}
       className={styles.primary}>{selectedReply.accessEnded?"Open history":"Answer in Messages"}</Link>
      <button type="button" onClick={laterAndNext} className={styles.secondary}>Later &amp; next</button>
     </div>
     <p className={styles.helper}>Open Messages to reply. Merely selecting this item never sends email or marks a message handled.</p>
    </div>:null}
    {current?<><div className={styles.personHead}>
      <div className={styles.identity}><div className={styles.avatar} aria-hidden="true">{current.leadName.trim().split(/\s+/).slice(0,2).map(part=>part[0]?.toUpperCase()??"").join("")}</div>
       <div><h2>{current.leadName}</h2><p className={styles.sub}>{leadInfo?.designation?leadInfo.designation+" · ":""}{current.companyName??"Recruiter"}</p>
       {leadInfo?.ownerName?<p className={styles.sub}>Assigned to {leadInfo.ownerName}</p>:null}</div></div>
      <div className={styles.personActions}>
       {contact?<a href={contact} className={styles.secondary}>Call</a>:null}
       {emailHref?<a href={emailHref} className={styles.secondary}>Email</a>:null}
       <Link href={"/tpo/recruiters/"+encodeURIComponent(current.leadId)} className={styles.secondary}>Open page</Link>
      </div>
     </div>
     <div className={styles.context}><span className={styles.eyebrow}>{leadInfo?.stage?"RECRUITER · "+leadInfo.stage.replaceAll("_"," "):"RECORDED FOLLOW-UP"}</span>
       <strong>{current.note?.trim()||"A recorded recruiter follow-up is due."}</strong></div>
     <p className={styles.sub}>Due {when(current.dueAt)}. Review the full recruiter record for company trust and verification before changing access.</p>
     <div className={styles.actions}><button type="button" disabled={pending} className={styles.secondary} onClick={()=>setConfirm("TOMORROW")}>Tomorrow</button>
      <button type="button" disabled={pending} className={styles.primary} onClick={laterAndNext}>Later &amp; next</button></div>
     <p className={styles.helper}>Later &amp; next moves to the next item without changing the current reminder.</p>
     <div className={styles.facts}><div><span className={styles.eyebrow}>RECRUITER STATUS</span><p>{leadInfo?.stage?leadInfo.stage.replaceAll("_"," "):"See recruiter history"}</p></div>
      <div><span className={`${styles.eyebrow} uppercase`}>Company</span><p>{current.companyName??"Not linked"} · Review company trust on its record</p></div></div>
     <details className={styles.advanced}><summary>Record outcome and plan next follow-up</summary>
      <p className={styles.sub}>Confirmed outcomes are saved with your account and close this follow-up atomically.</p>
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
     </details>
     <Link className={styles.link} href={"/tpo/recruiters/"+encodeURIComponent(current.leadId)}>
       Open full recruiter history ›
     </Link>
    </>:!selected?<div className={styles.empty}>No recorded work is selected.
      <Link href="/tpo/recruiters">Browse recruiters ›</Link>
     </div>:null}
   </section>
  </div>
  <details className={styles.inboxExtras}><summary>Recruiter replies and messages</summary>
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
      <Link href={"/tpo/messages?tab=recruiters&status=REPLY&thread="+encodeURIComponent(item.id)}
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
  </details>
  <ConfirmDialog open={confirm!==null} onOpenChange={value=>{if(!value&&!pending)setConfirm(null);}}
   title={confirm==="DONE"?"Record this outcome and finish the follow-up?":
    "Move this follow-up to tomorrow at 10 AM IST?"}
   confirmLabel={confirm==="DONE"?"Confirm Done & next":"Confirm Tomorrow"}
   pending={pending} onConfirm={()=>{if(confirm)void submit(confirm);}}>
    <p className={styles.sub}>Only the selected follow-up is changed. If another team member changed it, the action is rejected.</p>
  </ConfirmDialog>
 </div>;
}
