import Link from "next/link";
import {istDateKey,splitTpoTodayFollowups,tpoTodayFocusHref,tpoTodayAgendaHref,tpoTodayLateDays,type TpoCompaniesTodayRow} from "@/modules/placements/tpo-companies-today-model";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
import { TextLink } from "@/components/ui/text-link";
import { istTimeFormatter } from "@/lib/format-date";
import { createDateFormatter } from "@/lib/format-date";

import { DEFAULT_TIME_ZONE } from "@/config/locale";
export type TpoTodayView="focus"|"agenda"|"brief";
export type TpoTodayReply={
 id:string;name:string;company:string|null;subject:string;
 preview:string|null;receivedAt:string;accessEnded:boolean;
};

function formatDay(date:Date,weekday:"short"|"long"="short"){
 return createDateFormatter("en-IN", {
  timeZone:DEFAULT_TIME_ZONE,weekday,day:"numeric",month:"short",
 }).format(date);
}
function formatTime(date:Date){
 return istTimeFormatter.format(date);
}
function messageHref(id:string){
 return "/tpo/messages?tab=recruiters&thread="+encodeURIComponent(id);
}
function ReplyRow({reply,mode="brief"}:{reply:TpoTodayReply;mode?:"brief"|"agenda"}){
 return <li className="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--lms-border)] px-4 py-3 last:border-b-0">
  <div className="min-w-0 flex-1">
   <p className="font-bold text-[color:var(--lms-heading)]">{reply.name}
    <span className="ml-2 text-xs font-normal text-[color:var(--lms-text-muted)]">{formatTime(new Date(reply.receivedAt))}</span>
   </p>
   <p className="mt-1 text-[13px] text-[color:var(--lms-text-muted)]">{reply.company??"Recruiter"} · {reply.subject}</p>
   {reply.preview?<p className="mt-2 break-words rounded-lg bg-[color:var(--lms-gold-subtle)] px-3 py-2 text-[13px] text-[color:var(--lms-text-body)]">{reply.preview}</p>:null}
  </div>
  <TextLink variant="bare" className={"inline-flex min-h-11 items-center rounded-lg border px-4 text-[13px] font-bold "+(mode==="agenda"?
    "border-[color:var(--lms-neutral-300)] bg-surface text-[color:var(--lms-heading)]":"border-[color:var(--lms-button-primary)] bg-[color:var(--lms-button-primary)] text-[color:var(--lms-on-primary)]")}
   href={messageHref(reply.id)}>{reply.accessEnded?"Open history":"Answer"}</TextLink>
 </li>;
}
function FollowupRow({row,scope,now,mode="brief"}:{row:TpoCompaniesTodayRow;scope:"MINE"|"TEAM";now:Date;mode?:"brief"|"agenda"}){
 const late=tpoTodayLateDays(row.dueAt,now);
 return <li className="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--lms-border)] px-4 py-3 last:border-b-0">
  <div className="min-w-0 flex-1">
   <p className="font-bold text-[color:var(--lms-heading)]">{row.leadName}</p>
   <p className="mt-1 text-[13px] text-[color:var(--lms-text-muted)]">{row.companyName??"Recruiter"} · {late>0?late+" "+(late===1?"day":"days")+" late":"Follow-up due"} · {formatDay(new Date(row.dueAt))}</p>
   <p className="mt-1 text-[13px] text-[color:var(--lms-text-body)]">{row.note?.trim()||"Recorded recruiter follow-up."}</p>
  </div>
  <TextLink variant="bare" className={"inline-flex min-h-11 items-center rounded-lg border px-4 text-[13px] font-bold "+(mode==="agenda"?
    "border-[color:var(--lms-neutral-300)] bg-surface text-[color:var(--lms-heading)]":"border-[color:var(--lms-button-primary)] bg-[color:var(--lms-button-primary)] text-[color:var(--lms-on-primary)]")}
   href={tpoTodayFocusHref(scope,row.id)}>Review follow-up</TextLink>
 </li>;
}

/** Alternate representations of the same persisted Today queue. Incomplete
 * preview pages are explicitly labeled; we never infer an uncontacted count
 * or email-delivery status from CRM follow-up rows. */
export function TpoTodayAlternateViews({
 view,scope,rows,replies,replyTotal,nowIso,hasMore,selectedDay,notContacted,outsideWeek
}:{
 view:"agenda"|"brief";scope:"MINE"|"TEAM";selectedDay:number;
 rows:readonly TpoCompaniesTodayRow[];replies:readonly TpoTodayReply[];
 replyTotal:number|null;nowIso:string;hasMore:boolean;
 notContacted:{count:number;oldestAddedAt:string|null}|null;
 outsideWeek:{withoutDate:number;laterThanWeek:number}|null;
}){
 const now=new Date(nowIso);
 const todayKey=istDateKey(now);
 const {due,upcoming}=splitTpoTodayFollowups(rows,now);
 const days=Array.from({length:7},(_,index)=>{
  const date=new Date(now.getTime()+index*86400000);
  const key=istDateKey(date);
  return {key,date,count:rows.filter(row=>index===0?
   istDateKey(new Date(row.dueAt))<=todayKey:
   istDateKey(new Date(row.dueAt))===key).length};
 });
 const agendaRows=selectedDay===0?due:rows.filter(row=>
  istDateKey(new Date(row.dueAt))===days[selectedDay]?.key);
 const agendaReplies=selectedDay===0?replies:[];
 const agendaReplyTotal=selectedDay===0?replyTotal:0;
 const agendaDay=days[selectedDay]?.date??now;
 const replyTasks=replyTotal??0;
 const taskCount=due.length+replyTasks;
 const firstAction=replies.find(item=>!item.accessEnded);
 const agendaAction=selectedDay===0?firstAction:undefined;
 const startHref=view==="agenda"?(agendaAction?messageHref(agendaAction.id):
  tpoTodayFocusHref(scope,agendaRows[0]?.id)):
  firstAction?messageHref(firstAction.id):tpoTodayFocusHref(scope,due[0]?.id);
 const panel="min-w-0 overflow-hidden rounded-xl border border-[color:var(--lms-border)] bg-surface";
 const heading="border-b border-[color:var(--lms-border)] px-4 py-4 text-[18px] font-bold text-[color:var(--lms-heading)]";
 return <div className="min-w-0 space-y-4 text-[color:var(--lms-heading)]" data-testid={"tpo.today."+view}>
  {view==="brief"?<header className="flex flex-wrap items-center justify-between gap-4">
   <div>
    <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--lms-text-muted)]">{formatDay(now,"long")} · {scope==="MINE"?"Yours and unassigned":"Everyone's work"}</p>
    <Heading level={1} size="2xl" className="mt-1 leading-tight">{taskCount} things need you today</Heading>
   </div>
   <ButtonLink variant="primary" href={startHref}>Start · {taskCount} things</ButtonLink>
  </header>:null}
  {replyTotal===null?<p role="status" className="rounded-lg border border-[color:var(--lms-icon-amber)] bg-[color:var(--lms-gold-subtle)] p-3 text-sm">Recruiter replies are temporarily unavailable. No zero reply count is implied. <TextLink href="/tpo/messages?tab=recruiters">Check Messages</TextLink></p>:null}
  {hasMore?<p role="status" className="rounded-lg border border-[color:var(--lms-icon-amber)] bg-[color:var(--lms-gold-subtle)] p-3 text-sm">This agenda uses a limited preview of the due and upcoming follow-up queue. <TextLink href="/tpo/follow-ups">Open all follow-ups</TextLink>.</p>:null}
  {view==="agenda"?<>
   <nav className="grid grid-cols-7 gap-2 max-sm:gap-1" aria-label="Next seven days">
    {days.map((day,index)=><TextLink variant="bare" key={day.key}
     href={tpoTodayAgendaHref(scope,index)} aria-current={selectedDay===index?"date":undefined}
     className={"rounded-xl border px-2 py-3 text-center "+(selectedDay===index?
      "border-[color:var(--lms-button-primary)] bg-[color:var(--lms-primary-subtle)]":"border-[color:var(--lms-border)] bg-surface")}>
     <span className="block text-xs font-bold uppercase text-[color:var(--lms-text-muted)]">{formatDay(day.date).split(" ")[0]}</span>
     <strong className="mt-1 block text-xl">{createDateFormatter("en-IN", {timeZone:DEFAULT_TIME_ZONE,day:"numeric"}).format(day.date)}</strong>
     <span className="text-xs text-[color:var(--lms-button-primary)]">{day.count||"—"}</span>
    </TextLink>)}
   </nav>
   <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
    <section className={panel} aria-label="Due today">
     <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--lms-border)] px-5 py-4">
      <Heading level={2} size="lg" className="text-[color:var(--lms-heading)]">{selectedDay===0?"Today":formatDay(agendaDay)}: {agendaReplyTotal===null?"replies unavailable":agendaReplyTotal+" to answer"}, {agendaRows.length} to reach</Heading>
      <ButtonLink variant="primary" href={startHref}>Start · {agendaRows.length+(agendaReplyTotal??0)} things</ButtonLink>
     </div>
     {agendaReplies.length?<ul>{agendaReplies.map(reply=><ReplyRow key={reply.id} reply={reply} mode="agenda"/>)}</ul>:null}
     {agendaRows.length?<ul>{agendaRows.map(row=><FollowupRow key={row.id} row={row} scope={scope} now={now} mode="agenda"/>)}</ul>:null}
     {!agendaReplies.length&&!agendaRows.length?<p className="p-5 text-sm text-[color:var(--lms-text-muted)]">No recorded recruiter replies or follow-ups for this day in the available preview.</p>:null}
    </section>
    <aside className="space-y-3" aria-label="Other follow-up actions">
     <section className={panel}><Heading level={2} className={heading}>Not contacted yet</Heading>
      <p className="px-4 py-3 text-sm text-[color:var(--lms-text-muted)]">{notContacted===null?"Count unavailable":notContacted.count+" recruiter leads"} not contacted yet{notContacted?.oldestAddedAt?" · oldest added "+formatDay(new Date(notContacted.oldestAddedAt)):""}.</p>
      <TextLink variant="bare" href="/tpo/recruiters?stage=NEW" className="inline-flex min-h-11 items-center px-4 pb-3 font-semibold text-[color:var(--lms-button-primary)]">Start with them</TextLink>
     </section>
     <section className={panel}><Heading level={2} className={heading}>Not on the week</Heading>
      {outsideWeek===null?<p role="status" className="px-4 py-3 text-sm text-[color:var(--lms-text-muted)]">Counts unavailable. Open the full recruiter list to review next steps.</p>:
       <div className="space-y-2 px-4 py-3 text-sm">
        <p><TextLink variant="bare" href="/tpo/recruiters?nextFollowup=NONE" className="font-semibold text-[color:var(--lms-button-primary)]">{outsideWeek.withoutDate} with no date</TextLink></p>
        <p><TextLink variant="bare" href="/tpo/recruiters?nextFollowup=LATER" className="font-semibold text-[color:var(--lms-button-primary)]">{outsideWeek.laterThanWeek} later than the next seven days</TextLink></p>
       </div>}
      <TextLink variant="bare" href="/tpo/follow-ups" className="inline-flex min-h-11 items-center px-4 pb-3 font-semibold text-[color:var(--lms-button-primary)]">Re-plan your week</TextLink>
     </section>
    </aside>
   </div>
  </>:<div className="grid min-w-0 items-start gap-4 lg:grid-cols-3">
   <section className={panel} aria-label="Answer">
    <Heading level={2} className={heading}>Answer <span className="float-right text-sm text-[color:var(--lms-error-text)]">{replyTotal===null?"Unavailable":replyTasks+" waiting"}</span></Heading>
    {replies.length?<ul>{replies.map(reply=><ReplyRow key={reply.id} reply={reply}/>)}</ul>:
     <p className="p-4 text-sm text-[color:var(--lms-text-muted)]">{replyTotal===null?"Check Messages for the current queue.":"No recruiter replies in this preview."}</p>}
    {replyTotal!==null&&replyTotal>replies.length?<TextLink variant="bare" className="inline-flex p-4 text-sm font-semibold text-[color:var(--lms-button-primary)]" href="/tpo/messages?tab=recruiters">See all {replyTotal} conversations</TextLink>:null}
   </section>
   <section className={panel} aria-label="Reach">
    <Heading level={2} className={heading}>Reach <span className="float-right text-sm text-[color:var(--lms-error-text)]">{due.length} due</span></Heading>
    {due.length?<ul>{due.map(row=><FollowupRow key={row.id} row={row} scope={scope} now={now}/>)}</ul>:
     <p className="p-4 text-sm text-[color:var(--lms-text-muted)]">No recorded due follow-ups in this preview.</p>}
   </section>
   <section className={panel} aria-label="This week">
    <Heading level={2} className={heading}>This week <TextLink variant="bare" href="/tpo/follow-ups" className="float-right text-sm text-[color:var(--lms-button-primary)]">Re-plan</TextLink></Heading>
    <ul>{upcoming.slice(0,8).map(row=><li key={row.id} className="border-b border-[color:var(--lms-border)] p-4 last:border-b-0">
     <p className="text-xs font-bold uppercase text-[color:var(--lms-text-muted)]">{formatDay(new Date(row.dueAt))}</p>
     <div className="mt-2 flex items-center justify-between gap-2"><span className="text-sm font-semibold">{row.leadName} · {row.companyName??"Recruiter"}</span>
      <TextLink variant="bare" href={tpoTodayFocusHref(scope,row.id)} className="text-xs font-bold text-[color:var(--lms-button-primary)]">Follow up</TextLink>
     </div>
    </li>)}</ul>
    {!upcoming.length?<p className="p-4 text-sm text-[color:var(--lms-text-muted)]">No further scheduled follow-ups in this preview.</p>:null}
    <div className="border-t border-[color:var(--lms-border)] bg-[color:var(--lms-neutral-50)] p-4">
     <p className="font-bold">{notContacted===null?"Not contacted yet":notContacted.count+" not contacted yet"}</p>
     <p className="mt-1 text-xs text-[color:var(--lms-text-muted)]">{notContacted===null?"Count temporarily unavailable.":notContacted.oldestAddedAt?"Oldest added "+formatDay(new Date(notContacted.oldestAddedAt)):"No uncontacted recruiters in the authorized roster."}</p>
     <ButtonLink variant="secondary" href="/tpo/recruiters?stage=NEW" className="mt-2">Start with them</ButtonLink>
    </div>
   </section>
   {outsideWeek===null?<p role="status" className="text-sm text-[color:var(--lms-text-muted)] lg:col-span-3">Undated and later follow-up totals are temporarily unavailable.</p>:
    <nav aria-label="Not on the week" className="flex flex-wrap gap-4 text-[13px] text-[color:var(--lms-button-primary)] lg:col-span-3">
     <Link href="/tpo/recruiters?nextFollowup=NONE">{outsideWeek.withoutDate} with no date</Link>
     <Link href="/tpo/recruiters?nextFollowup=LATER">{outsideWeek.laterThanWeek} later than the next seven days</Link>
    </nav>}
  </div>}
 </div>;
}
