import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { istIsoDateFormatter, istWeekdayDayMonthFormatter, istTimeFormatter } from "@/lib/format-date";

export type TpoHomeFocusNeed = {
 type:string; priority:number; title:string; count:number; link:string;
};
export type TpoHomeFocusEvent = {startsAt:Date;title:string};

function istDay(value:Date){
 return istIsoDateFormatter.format(value);
}
function dayLabel(value:Date){
 return istWeekdayDayMonthFormatter.format(value);
}
function timeLabel(value:Date){
 return istTimeFormatter.format(value);
}
function needCategory(type:string){
 if(/TEAM/.test(type))return "TEAM";
 if(/REQUEST|REGISTRATION|STUDENT|VERIFY/.test(type))return "STUDENTS";
 if(/RECRUITER|FOLLOW_UP/.test(type))return "COMPANIES";
 return "DRIVES";
}
const categoryClasses:Record<string,string>={
 TEAM:"bg-[color:var(--lms-neutral-100)] text-[color:var(--lms-text-muted)]",
 STUDENTS:"bg-[color:var(--lms-success-surface)] text-[color:var(--lms-success)]",
 COMPANIES:"bg-[color:var(--lms-primary-subtle)] text-[color:var(--lms-button-primary)]",
 DRIVES:"bg-[color:var(--lms-purple-surface)] text-[color:var(--lms-icon-purple)]",
};

/** The newest 42LMS TPO Home: live prioritized work on the left, this-week
 * agenda and real college statistics on the right. Unknown data stays unknown. */
export function TpoHomePrototypeFocus({
 needs,events,calendarAvailable,placed,pool,now,
}:{needs:readonly TpoHomeFocusNeed[];events:readonly TpoHomeFocusEvent[];
  calendarAvailable:boolean;placed:number|null;pool:number|null;now:Date}){
 const ranked=[...needs].filter(item=>item.count>0)
  .sort((a,b)=>a.priority-b.priority||a.title.localeCompare(b.title));
 const tomorrow=new Date(now.getTime()+86400000);
 const tomorrowKey=istDay(tomorrow);
 const tomorrowEvents=events.filter(item=>istDay(item.startsAt)===tomorrowKey).slice(0,4);
 const laterEvents=events.filter(item=>istDay(item.startsAt)!==tomorrowKey).slice(0,4);
 const rate=placed!==null&&pool!==null&&pool>0?Math.round(placed/pool*100):null;
 return <div data-testid="tpo.home.prototype-focus"
   className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,2.5fr)_minmax(280px,1fr)] md:gap-5">
  <section aria-label="Things that need you" className="min-w-0 overflow-hidden rounded-xl border border-[color:var(--lms-border)] bg-surface">
   <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--lms-neutral-100)] px-4 py-3 sm:px-5">
    <div><Heading level={2} size="lg" className="leading-7 text-[color:var(--lms-heading)]">{ranked.length===0?"Nothing is waiting on you":ranked.length+" thing"+(ranked.length===1?"":"s")+" need you"}</Heading>
     <p className="text-xs text-[color:var(--lms-text-muted)]">Most urgent first · actions from your college</p></div>
    <TextLink href="/tpo/placements" className="text-xs text-[color:var(--lms-button-primary)]">Drives ›</TextLink>
   </header>
   {ranked.length?<ul className="divide-y divide-[color:var(--lms-neutral-100)]">{ranked.slice(0,6).map(need=>{
    const category=needCategory(need.type);
    return <li key={need.type+need.link} className="flex min-w-0 items-center gap-3 px-4 py-3 sm:px-5">
     <span className={"w-[84px] shrink-0 rounded px-2 py-1 text-center text-xs font-bold tracking-[.05em] "+categoryClasses[category]}>{category}</span>
     <div className="min-w-0 flex-1"><TextLink href={need.link}
       className="break-words text-sm text-[color:var(--lms-heading)]">{need.title}</TextLink>
      <p className="mt-1 text-xs text-[color:var(--lms-text-muted)]">{need.count} {need.count===1?"item":"items"} awaiting action</p></div>
     <ButtonLink variant="secondary" href={need.link} className="shrink-0">Open</ButtonLink>
    </li>;
   })}</ul>:<p className="px-5 py-7 text-sm text-[color:var(--lms-text-muted)]">New requests, replies and drive actions appear here when they need attention.</p>}
   <footer className="border-t border-[color:var(--lms-neutral-100)] bg-[color:var(--lms-neutral-50)] px-4 py-3 text-xs leading-5 text-[color:var(--lms-text-muted)] sm:px-5">
    {ranked.length>6?<span>{ranked.length-6} more actions · <TextLink href="/tpo/placements/overview" className="text-[color:var(--lms-button-primary)]">Open work overview</TextLink>. </span>:null}
    Recruiters to contact today are in <TextLink href="/tpo/companies/today" className="text-[color:var(--lms-button-primary)]">Companies › Today</TextLink>.
   </footer>
  </section>
  <aside aria-label="Your next week and placement performance" className="min-w-0 space-y-4">
   <section aria-label="Upcoming placement schedule" className="rounded-xl border border-[color:var(--lms-border)] bg-surface p-4">
    <div className="flex items-center justify-between gap-2">
     <Heading level={2} size="xs" className="uppercase tracking-[.08em] text-[color:var(--lms-text-muted)]">Tomorrow · {dayLabel(tomorrow)}</Heading>
     <TextLink variant="bare" href="/tpo/calendar" className="text-xs font-semibold text-[color:var(--lms-button-primary)]">Calendar ›</TextLink>
    </div>
    {!calendarAvailable?<p className="mt-3 text-sm text-[color:var(--lms-text-muted)]">The calendar could not be refreshed. <TextLink href="/tpo/calendar">Open calendar</TextLink>.</p>:
     tomorrowEvents.length?<ul className="mt-2 divide-y divide-[color:var(--lms-neutral-100)]">{tomorrowEvents.map((event,index)=><li key={index} className="grid grid-cols-[65px_minmax(0,1fr)] gap-2 py-2 text-sm"><time className="font-semibold text-[color:var(--lms-heading)]">{timeLabel(event.startsAt)}</time><span className="break-words text-[color:var(--lms-text-muted)]">{event.title}</span></li>)}</ul>:
      <p className="mt-3 text-sm text-[color:var(--lms-text-muted)]">No recorded placement events tomorrow.</p>}
    {laterEvents.length?<><Heading level={3} size="xs" className="mt-4 uppercase tracking-wider text-[color:var(--lms-text-muted)]">Later this week</Heading>
     <ul className="mt-1 divide-y divide-[color:var(--lms-neutral-100)]">{laterEvents.map((event,index)=><li key={index} className="grid grid-cols-[65px_minmax(0,1fr)] gap-2 py-2 text-sm"><time className="font-semibold text-[color:var(--lms-heading)]">{dayLabel(event.startsAt)}</time><span className="break-words text-[color:var(--lms-text-muted)]">{event.title}</span></li>)}</ul>
    </>:null}
   </section>
   <section aria-label="Placement overview" className="rounded-xl border border-[color:var(--lms-border)] bg-surface p-4">
    <div className="flex items-center justify-between gap-2"><Heading level={2} size="xs" className="uppercase tracking-[.08em] text-[color:var(--lms-text-muted)]">Placement overview</Heading>
     <TextLink variant="bare" href="/tpo/reports" className="text-xs font-semibold text-[color:var(--lms-button-primary)]">Reports ›</TextLink></div>
    <dl className="mt-3 grid grid-cols-3 gap-2">
     <div><dt className="text-xs text-[color:var(--lms-text-muted)]">Placed</dt><dd className="mt-1 text-2xl font-bold tabular-nums text-[color:var(--lms-heading)]">{placed??"—"}</dd></div>
     <div><dt className="text-xs text-[color:var(--lms-text-muted)]">In pool</dt><dd className="mt-1 text-2xl font-bold tabular-nums text-[color:var(--lms-heading)]">{pool??"—"}</dd></div>
     <div><dt className="text-xs text-[color:var(--lms-text-muted)]">Rate</dt><dd className="mt-1 text-2xl font-bold tabular-nums text-[color:var(--lms-heading)]">{rate!==null?rate+"%":"—"}</dd></div>
    </dl>
    <div role="img" aria-label={rate===null?"Placement rate unavailable":"Placement rate "+rate+" percent"} className="mt-4 h-2 overflow-hidden rounded-full bg-[color:var(--lms-border)]">
     {rate!==null?<div className="h-full rounded-full bg-[color:var(--lms-button-primary)]" style={{width:Math.min(100,Math.max(0,rate))+"%"}}/>:null}
    </div>
    <TextLink href="/tpo/reports/by-branch" className="mt-3 inline-flex min-h-9 items-center text-xs text-[color:var(--lms-button-primary)]">See branch breakdown</TextLink>
   </section>
  </aside>
 </div>;
}
