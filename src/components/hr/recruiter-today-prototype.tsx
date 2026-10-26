"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {
  type RecruiterTodayTask, readRecruiterTodayLater,
  putRecruiterTodayLater,
} from "@/modules/placements/recruiter-today-later-model";
import {recruiterTodayHeadline} from "@/modules/placements/recruiter-today-headline-model";
import styles from "./recruiter-today-prototype.module.css";

type WeekEvent={id:string;kind:string;title:string;jobTitle:string;href:string;when:string};
type Waiting={id:string;title:string;detail:string;href?:string};
type LiveDrive={title:string;href:string;deadline:string|null;sharedApplicants:number|null};
export type RecruiterTodayPrototypeProps={
  greeting:string;dateLabel:string;collegeName:string;storageKey:string;
  hasDriveHistory:boolean|null;firstDriveHref:string;calendarHref:string;
  tasks:RecruiterTodayTask[];weekEvents:WeekEvent[];
  waiting:Waiting[];waitingUnavailable:boolean;signalsUnavailable?:boolean;liveDrive?:LiveDrive|null;
};
function cta(task:RecruiterTodayTask):string{
  if(task.key.startsWith("answer:"))return "Answer";
  if(task.key.startsWith("slots:"))return "See the slots";
  if(task.key.startsWith("fix:"))return "Fix and resend";
  if(task.key.startsWith("review:"))return "Review";
  if(task.key.startsWith("due:"))return "Check results";
  if(task.key.startsWith("thread:"))return "Read messages";
  if(task.key==="notifications")return "Open inbox";
  return "Open";
}
function tag(task:RecruiterTodayTask):string{
  if(task.key.startsWith("answer:"))return "PLACEMENT CELL ASKED";
  if(task.key.startsWith("review:"))return "SHARED";
  if(task.tone==="URGENT")return "URGENT";
  if(task.tone==="SOON")return "NEEDS YOU";
  return "WHEN YOU CAN";
}
export function RecruiterTodayPrototype(props:RecruiterTodayPrototypeProps){
  const [later,setLater]=useState<Record<string,string>>({});
  const [expanded,setExpanded]=useState(false);
  useEffect(()=>{
    try{
      setLater(readRecruiterTodayLater(window.localStorage.getItem(props.storageKey),props.tasks));
    }catch{setLater({});}
  },[props.storageKey,props.tasks]);
  function persist(next:Record<string,string>){
    const cleaned=readRecruiterTodayLater(JSON.stringify(next),props.tasks);
    setLater(cleaned);
    try{window.localStorage.setItem(props.storageKey,JSON.stringify(cleaned));}catch{/* Storage unavailable. The current page still works. */}
  }
  const actionable=props.tasks.filter(task=>Boolean(task.href));
  const passive=props.tasks.filter(task=>!task.href);
  const visible=actionable.filter(task=>!later[task.key]);
  const postponed=actionable.length-visible.length;
  const shown=expanded?visible:visible.slice(0,3);
  const headline=recruiterTodayHeadline(props.greeting,visible.length,props.hasDriveHistory,postponed,props.signalsUnavailable);
  const nextEvent=props.weekEvents[0];
  const subtitle=nextEvent?nextEvent.title+" · "+nextEvent.jobTitle+" · "+nextEvent.when:null;
  return <div className={styles.root} data-testid="recruiter.today">
    <header className={styles.heading}>
      <span className={styles.meta}>{props.dateLabel}</span>
      <h1>{headline}</h1>
      {subtitle?<span className={styles.subtitle}>{subtitle}</span>:null}
    </header>
    <div className={styles.layout}>
      <section className={styles.needs} aria-label="Needs you">
        {shown.map(task=><div key={task.key} className={styles.need} data-testid={"recruiter.today.task-"+task.key}>
          <div className={styles.needWords}>
            <span className={styles.tag} data-tone={task.tone}>{tag(task)}</span>
            <strong>{task.title}</strong>
            <span className={styles.detail}>{task.description}</span>
          </div>
          <div className={styles.needActions}>
            {task.href?<Link href={task.href} className={styles.primary}>{cta(task)}</Link>:null}
            <button type="button" className={styles.button} title="Hide until something changes"
              onClick={()=>persist(putRecruiterTodayLater(later,task))}>Later</button>
          </div>
        </div>)}
        {!shown.length&&postponed===0&&props.hasDriveHistory===false?
          <div className={styles.empty}>
            <strong>Start with your first drive</strong>
            <ol className={styles.firstSteps}>
              <li>Describe the role, pay and how you select. Your draft is kept as you type.</li>
              <li>The placement cell reviews the request, confirms dates and publishes to students.</li>
              <li>Once applicants are shared, you can review and send results to the placement cell.</li>
            </ol>
            <Link className={styles.primary} href={props.firstDriveHref}>Request your first drive</Link>
          </div>:null}
        {!shown.length&&postponed===0&&props.hasDriveHistory===true&&!props.signalsUnavailable?
          <div className={styles.empty} role="status">You’re all caught up{props.collegeName?" at "+props.collegeName:""}. New applicants, replies and decisions show up here.</div>:null}
        {!shown.length&&postponed===0&&props.hasDriveHistory===null?
          <div className={styles.empty} role="status">We could not confirm your complete drive history. Open Drives to check for other work.</div>:null}
        {!shown.length&&postponed===0&&props.hasDriveHistory===true&&props.signalsUnavailable?
          <div className={styles.empty} role="status">
            Today cannot confirm that your task queue is complete. Some signals are temporarily unavailable. Check Drives or retry Today.
          </div>:null}
        {!shown.length&&postponed>0?<div className={styles.empty} role="status">
          {postponed} {postponed===1?"action is":"actions are"} put off for later. Use “Show them” below when ready.
        </div>:null}
        {visible.length>3?<button className={styles.more} type="button"
          onClick={()=>setExpanded(value=>!value)}>{expanded?"Show the first three":"Show "+(visible.length-3)+" more actions"}</button>:null}
        {postponed>0?<div className={styles.foot}>{postponed} put off for later.{" "}
          <button type="button" onClick={()=>persist({})}>Show them</button>
        </div>:null}
      </section>
      <aside className={styles.side}>
        <section className={styles.card} aria-label="This week">
          <div className={styles.cardHead}><span className={styles.label}>THIS WEEK</span>
            <Link href={props.calendarHref}>Calendar ›</Link></div>
          {props.weekEvents.length?props.weekEvents.map(item=><Link key={item.id} href={item.href} className={styles.event}>
            <strong>{item.when}</strong>
            <span>{item.title}<span className={styles.small}> · {item.jobTitle}</span></span>
          </Link>):<p className={styles.muted}>Nothing scheduled in the next 7 days.</p>}
        </section>
        {(props.waiting.length>0||passive.length>0||props.waitingUnavailable)?
          <section className={styles.card} aria-label="Waiting on the placement cell">
            <span className={styles.label}>WAITING ON THE PLACEMENT CELL</span>
            {props.waitingUnavailable?<p className={styles.muted} role="status">Some waiting items could not be loaded. Retry Today for an updated list.</p>:null}
            {props.waiting.map(item=><div className={styles.waiting} key={item.id}>
              <strong>{item.title}</strong>
              <span className={styles.small}>{item.detail}</span>
              {item.href?<Link href={item.href}>Open conversation ›</Link>:null}
            </div>)}
            {passive.map(item=><div className={styles.waiting} key={item.key}>
              <strong>{item.title}</strong>
              <span className={styles.small}>{item.description}</span>
            </div>)}
          </section>:null}
        {props.liveDrive?<Link href={props.liveDrive.href} className={styles.card+" "+styles.live}
          aria-label={"Open live drive "+props.liveDrive.title}>
          <span className={styles.label}>LIVE DRIVE</span>
          <strong>{props.liveDrive.title}</strong>
          <span className={styles.small}>{props.liveDrive.sharedApplicants===null
            ?"Shared applicant count unavailable":props.liveDrive.sharedApplicants+" applicants shared with you"}</span>
          <span className={styles.small}>{props.liveDrive.deadline
            ?"Applications close "+props.liveDrive.deadline:"No deadline recorded"}</span>
        </Link>:null}
      </aside>
    </div>
  </div>;
}
