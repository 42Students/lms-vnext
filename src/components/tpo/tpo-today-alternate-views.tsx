import Link from "next/link";
import {istDateKey,splitTpoTodayFollowups,tpoTodayFocusHref,tpoTodayAgendaHref,type TpoCompaniesTodayRow} from "@/modules/placements/tpo-companies-today-model";

export type TpoTodayView="focus"|"agenda"|"brief";
export type TpoTodayReply={
 id:string;name:string;company:string|null;subject:string;
 preview:string|null;receivedAt:string;accessEnded:boolean;
};

function formatDay(date:Date,weekday:"short"|"long"="short"){
 return new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",weekday,day:"numeric",month:"short",
 }).format(date);
}
function formatTime(date:Date){
 return new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",hour12:true,
 }).format(date);
}
function messageHref(id:string){
 return "/tpo/messages?tab=recruiters&thread="+encodeURIComponent(id);
}
function ReplyRow({reply,mode="brief"}:{reply:TpoTodayReply;mode?:"brief"|"agenda"}){
 return <li className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e8edf2] px-4 py-3 last:border-b-0">
  <div className="min-w-0 flex-1">
   <p className="font-bold text-[#172033]">{reply.name}
    <span className="ml-2 text-xs font-normal text-[#617084]">{formatTime(new Date(reply.receivedAt))}</span>
   </p>
   <p className="mt-1 text-[13px] text-[#617084]">{reply.company??"Recruiter"} · {reply.subject}</p>
   {reply.preview?<p className="mt-2 break-words rounded-lg bg-[#fff7ed] px-3 py-2 text-[13px] text-[#26354a]">{reply.preview}</p>:null}
  </div>
  <Link className={"inline-flex min-h-10 items-center rounded-lg border px-4 text-[13px] font-bold "+(mode==="agenda"?
    "border-[#d6e1ee] bg-white text-[#172033]":"border-[#087f8b] bg-[#087f8b] text-white")}
   href={messageHref(reply.id)}>{reply.accessEnded?"Open history":"Answer"}</Link>
 </li>;
}
function FollowupRow({row,scope,mode="brief"}:{row:TpoCompaniesTodayRow;scope:"MINE"|"TEAM";mode?:"brief"|"agenda"}){
 return <li className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e8edf2] px-4 py-3 last:border-b-0">
  <div className="min-w-0 flex-1">
   <p className="font-bold text-[#172033]">{row.leadName}</p>
   <p className="mt-1 text-[13px] text-[#617084]">{row.companyName??"Recruiter"} · {row.overdue?"Overdue":"Follow-up due"} · {formatDay(new Date(row.dueAt))}</p>
   <p className="mt-1 text-[13px] text-[#26354a]">{row.note?.trim()||"Recorded recruiter follow-up."}</p>
  </div>
  <Link className={"inline-flex min-h-10 items-center rounded-lg border px-4 text-[13px] font-bold "+(mode==="agenda"?
    "border-[#d6e1ee] bg-white text-[#172033]":"border-[#087f8b] bg-[#087f8b] text-white")}
   href={tpoTodayFocusHref(scope,row.id)}>Log the call</Link>
 </li>;
}

/** Alternate representations of the same persisted Today queue. Incomplete
 * preview pages are explicitly labeled; we never infer an uncontacted count
 * or email-delivery status from CRM follow-up rows. */
export function TpoTodayAlternateViews({
 view,scope,rows,replies,replyTotal,nowIso,hasMore,selectedDay,notContacted
}:{
 view:"agenda"|"brief";scope:"MINE"|"TEAM";selectedDay:number;
 rows:readonly TpoCompaniesTodayRow[];replies:readonly TpoTodayReply[];
 replyTotal:number|null;nowIso:string;hasMore:boolean;
 notContacted:{count:number;oldestAddedAt:string|null}|null;
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
 const panel="min-w-0 overflow-hidden rounded-xl border border-[#e7ecf2] bg-white";
 const heading="border-b border-[#e7ecf2] px-4 py-4 text-[17px] font-bold text-[#172033]";
 return <div className="min-w-0 space-y-4 text-[#172033]" data-testid={"tpo.today."+view}>
  {view==="brief"?<header className="flex flex-wrap items-center justify-between gap-4">
   <div>
    <p className="text-xs font-bold uppercase tracking-wide text-[#617084]">{formatDay(now,"long")} · {scope==="MINE"?"Yours and unassigned":"Everyone's work"}</p>
    <h1 className="mt-1 text-[24px] font-bold leading-tight">{taskCount} things need you today</h1>
   </div>
   <Link className="inline-flex min-h-11 items-center rounded-lg bg-[#087f8b] px-5 text-[13px] font-bold text-white" href={startHref}>Start · {taskCount} things</Link>
  </header>:null}
  {replyTotal===null?<p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">Recruiter replies are temporarily unavailable. No zero reply count is implied. <Link href="/tpo/messages?tab=recruiters" className="font-semibold underline">Check Messages</Link></p>:null}
  {hasMore?<p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">This agenda uses a limited preview of the due and upcoming follow-up queue. <Link href="/tpo/follow-ups" className="font-semibold underline">Open all follow-ups</Link>.</p>:null}
  {view==="agenda"?<>
   <nav className="grid grid-cols-7 gap-2 max-sm:gap-1" aria-label="Next seven days">
    {days.map((day,index)=><Link key={day.key}
     href={tpoTodayAgendaHref(scope,index)} aria-current={selectedDay===index?"date":undefined}
     className={"rounded-xl border px-2 py-3 text-center "+(selectedDay===index?
      "border-[#087f8b] bg-[#eef8fa]":"border-[#e7ecf2] bg-white")}>
     <span className="block text-[11px] font-bold uppercase text-[#617084]">{formatDay(day.date).split(" ")[0]}</span>
     <strong className="mt-1 block text-xl">{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric"}).format(day.date)}</strong>
     <span className="text-xs text-[#087f8b]">{day.count||"—"}</span>
    </Link>)}
   </nav>
   <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
    <section className={panel} aria-label="Due today">
     <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7ecf2] px-5 py-4">
      <h2 className="text-[18px] font-bold text-[#172033]">{selectedDay===0?"Today":formatDay(agendaDay)}: {agendaReplyTotal===null?"replies unavailable":agendaReplyTotal+" to answer"}, {agendaRows.length} to reach</h2>
      <Link className="inline-flex min-h-11 items-center rounded-lg bg-[#087f8b] px-5 text-[13px] font-bold text-white" href={startHref}>Start · {agendaRows.length+(agendaReplyTotal??0)} things</Link>
     </div>
     {agendaReplies.length?<ul>{agendaReplies.map(reply=><ReplyRow key={reply.id} reply={reply} mode="agenda"/>)}</ul>:null}
     {agendaRows.length?<ul>{agendaRows.map(row=><FollowupRow key={row.id} row={row} scope={scope} mode="agenda"/>)}</ul>:null}
     {!agendaReplies.length&&!agendaRows.length?<p className="p-5 text-sm text-[#617084]">No recorded recruiter replies or follow-ups for this day in the available preview.</p>:null}
    </section>
    <aside className="space-y-3" aria-label="Other follow-up actions">
     <section className={panel}><h2 className={heading}>Not on the week</h2>
      <p className="px-4 py-3 text-sm text-[#617084]">Later and undated follow-ups cannot be counted from this seven-day preview.</p>
      <Link href="/tpo/follow-ups" className="inline-flex min-h-10 items-center px-4 pb-3 font-semibold text-[#087f8b]">Re-plan your week</Link>
     </section>
     <section className={panel}><h2 className={heading}>Not contacted yet</h2>
      <p className="px-4 py-3 text-sm text-[#617084]">{notContacted===null?"Count unavailable":notContacted.count+" recruiter leads"} not contacted yet{notContacted?.oldestAddedAt?" · oldest added "+formatDay(new Date(notContacted.oldestAddedAt)):""}.</p>
      <Link href="/tpo/recruiters?stage=NEW" className="inline-flex min-h-10 items-center px-4 pb-3 font-semibold text-[#087f8b]">Start with them</Link>
     </section>
    </aside>
   </div>
  </>:<div className="grid min-w-0 items-start gap-4 lg:grid-cols-3">
   <section className={panel} aria-label="Answer">
    <h2 className={heading}>Answer <span className="float-right text-sm text-[#b42318]">{replyTotal===null?"Unavailable":replyTasks+" waiting"}</span></h2>
    {replies.length?<ul>{replies.map(reply=><ReplyRow key={reply.id} reply={reply}/>)}</ul>:
     <p className="p-4 text-sm text-[#617084]">{replyTotal===null?"Check Messages for the current queue.":"No recruiter replies in this preview."}</p>}
    {replyTotal!==null&&replyTotal>replies.length?<Link className="inline-flex p-4 text-sm font-semibold text-[#087f8b]" href="/tpo/messages?tab=recruiters">See all {replyTotal} conversations</Link>:null}
   </section>
   <section className={panel} aria-label="Reach">
    <h2 className={heading}>Reach <span className="float-right text-sm text-[#b42318]">{due.length} due</span></h2>
    {due.length?<ul>{due.map(row=><FollowupRow key={row.id} row={row} scope={scope}/>)}</ul>:
     <p className="p-4 text-sm text-[#617084]">No recorded due follow-ups in this preview.</p>}
   </section>
   <section className={panel} aria-label="This week">
    <h2 className={heading}>This week <Link href="/tpo/follow-ups" className="float-right text-sm text-[#087f8b]">Re-plan</Link></h2>
    <ul>{upcoming.slice(0,8).map(row=><li key={row.id} className="border-b border-[#e8edf2] p-4 last:border-b-0">
     <p className="text-xs font-bold uppercase text-[#617084]">{formatDay(new Date(row.dueAt))}</p>
     <div className="mt-2 flex items-center justify-between gap-2"><span className="text-sm font-semibold">{row.leadName} · {row.companyName??"Recruiter"}</span>
      <Link href={tpoTodayFocusHref(scope,row.id)} className="text-xs font-bold text-[#087f8b]">Follow up</Link>
     </div>
    </li>)}</ul>
    {!upcoming.length?<p className="p-4 text-sm text-[#617084]">No further scheduled follow-ups in this preview.</p>:null}
    <div className="border-t border-[#e8edf2] bg-[#f8fafb] p-4">
     <p className="font-bold">{notContacted===null?"Not contacted yet":notContacted.count+" not contacted yet"}</p>
     <p className="mt-1 text-xs text-[#617084]">{notContacted===null?"Count temporarily unavailable.":notContacted.oldestAddedAt?"Oldest added "+formatDay(new Date(notContacted.oldestAddedAt)):"No uncontacted recruiters in the authorized roster."}</p>
     <Link href="/tpo/recruiters?stage=NEW" className="mt-2 inline-flex min-h-10 items-center rounded-lg border border-[#d6e1ee] px-3 text-xs font-bold text-[#26354a]">Start with them</Link>
    </div>
   </section>
  </div>}
 </div>;
}
