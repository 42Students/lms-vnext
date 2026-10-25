import Link from "next/link";

export type TpoHomeFocusNeed = {
 type:string; priority:number; title:string; count:number; link:string;
};
export type TpoHomeFocusEvent = {startsAt:Date;title:string};

function istDay(value:Date){
 return new Intl.DateTimeFormat("en-CA",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
 }).format(value);
}
function dayLabel(value:Date){
 return new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",weekday:"short",day:"numeric",month:"short",
 }).format(value);
}
function timeLabel(value:Date){
 return new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",hour12:true,
 }).format(value);
}
function needCategory(type:string){
 if(/TEAM/.test(type))return "TEAM";
 if(/REQUEST|REGISTRATION|STUDENT|VERIFY/.test(type))return "STUDENTS";
 if(/RECRUITER|FOLLOW_UP/.test(type))return "COMPANIES";
 return "DRIVES";
}
const categoryClasses:Record<string,string>={
 TEAM:"bg-[#f2f4f7] text-[#53627c]",
 STUDENTS:"bg-[#ecf9f2] text-[#167353]",
 COMPANIES:"bg-[#eaf7f9] text-[#0a7c88]",
 DRIVES:"bg-[#eef0fc] text-[#3946a6]",
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
   className="grid min-w-0 items-start gap-4 min-[992px]:grid-cols-[minmax(0,2.5fr)_minmax(280px,1fr)] md:gap-5">
  <section aria-label="Things that need you" className="min-w-0 overflow-hidden rounded-xl border border-[#e7ecf2] bg-white">
   <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f3] px-4 py-3 sm:px-5">
    <div><h2 className="text-lg font-bold leading-7 text-[#172033]">{ranked.length===0?"Nothing is waiting on you":ranked.length+" thing"+(ranked.length===1?"":"s")+" need you"}</h2>
     <p className="text-xs text-[#617084]">Most urgent first · actions from your college</p></div>
    <Link href="/tpo/placements" className="text-xs font-semibold text-[#0a7c88] underline">Drives ›</Link>
   </header>
   {ranked.length?<ul className="divide-y divide-[#edf0f3]">{ranked.slice(0,6).map(need=>{
    const category=needCategory(need.type);
    return <li key={need.type+need.link} className="flex min-w-0 items-center gap-3 px-4 py-3 sm:px-5">
     <span className={"w-[85px] shrink-0 rounded px-2 py-1 text-center text-[10px] font-bold tracking-[.05em] "+categoryClasses[category]}>{category}</span>
     <div className="min-w-0 flex-1"><Link href={need.link}
       className="break-words text-sm font-semibold text-[#172033] hover:text-[#0a7c88] hover:underline">{need.title}</Link>
      <p className="mt-1 text-xs text-[#617084]">{need.count} {need.count===1?"item":"items"} awaiting action</p></div>
     <Link href={need.link} className="inline-flex min-h-9 shrink-0 items-center rounded-lg border border-[#e4e9ef] px-3 text-xs font-semibold text-[#172033] hover:bg-[#eff8fa]">Open</Link>
    </li>;
   })}</ul>:<p className="px-5 py-7 text-sm text-[#617084]">New requests, replies and drive actions appear here when they need attention.</p>}
   <footer className="border-t border-[#edf0f3] bg-[#f9fafb] px-4 py-3 text-xs leading-5 text-[#617084] sm:px-5">
    {ranked.length>6?<span>{ranked.length-6} more actions · <Link href="/tpo/placements/overview" className="font-semibold text-[#0a7c88] underline">Open work overview</Link>. </span>:null}
    Recruiters to contact today are in <Link href="/tpo/companies/today" className="font-semibold text-[#0a7c88] underline">Companies › Today</Link>.
   </footer>
  </section>
  <aside aria-label="Your next week and placement performance" className="min-w-0 space-y-4">
   <section aria-label="Upcoming placement schedule" className="rounded-xl border border-[#e7ecf2] bg-white p-4">
    <div className="flex items-center justify-between gap-2">
     <h2 className="text-xs font-bold uppercase tracking-[.08em] text-[#617084]">Tomorrow · {dayLabel(tomorrow)}</h2>
     <Link href="/tpo/calendar" className="text-xs font-semibold text-[#0a7c88]">Calendar ›</Link>
    </div>
    {!calendarAvailable?<p className="mt-3 text-sm text-[#617084]">The calendar could not be refreshed. <Link href="/tpo/calendar" className="underline">Open calendar</Link>.</p>:
     tomorrowEvents.length?<ul className="mt-2 divide-y divide-[#edf0f3]">{tomorrowEvents.map((event,index)=><li key={index} className="grid grid-cols-[65px_minmax(0,1fr)] gap-2 py-2 text-sm"><time className="font-semibold text-[#172033]">{timeLabel(event.startsAt)}</time><span className="break-words text-[#53627c]">{event.title}</span></li>)}</ul>:
      <p className="mt-3 text-sm text-[#617084]">No recorded placement events tomorrow.</p>}
    {laterEvents.length?<><h3 className="mt-4 text-[11px] font-bold uppercase tracking-wider text-[#617084]">Later this week</h3>
     <ul className="mt-1 divide-y divide-[#edf0f3]">{laterEvents.map((event,index)=><li key={index} className="grid grid-cols-[65px_minmax(0,1fr)] gap-2 py-2 text-sm"><time className="font-semibold text-[#172033]">{dayLabel(event.startsAt)}</time><span className="break-words text-[#53627c]">{event.title}</span></li>)}</ul>
    </>:null}
   </section>
   <section aria-label="Placement overview" className="rounded-xl border border-[#e7ecf2] bg-white p-4">
    <div className="flex items-center justify-between gap-2"><h2 className="text-xs font-bold uppercase tracking-[.08em] text-[#617084]">Placement overview</h2>
     <Link href="/tpo/reports" className="text-xs font-semibold text-[#0a7c88]">Reports ›</Link></div>
    <dl className="mt-3 grid grid-cols-3 gap-2">
     <div><dt className="text-[11px] text-[#617084]">Placed</dt><dd className="mt-1 text-2xl font-bold tabular-nums text-[#172033]">{placed??"—"}</dd></div>
     <div><dt className="text-[11px] text-[#617084]">In pool</dt><dd className="mt-1 text-2xl font-bold tabular-nums text-[#172033]">{pool??"—"}</dd></div>
     <div><dt className="text-[11px] text-[#617084]">Rate</dt><dd className="mt-1 text-2xl font-bold tabular-nums text-[#172033]">{rate!==null?rate+"%":"—"}</dd></div>
    </dl>
    <div role="img" aria-label={rate===null?"Placement rate unavailable":"Placement rate "+rate+" percent"} className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8edf2]">
     {rate!==null?<div className="h-full rounded-full bg-[#0a7c88]" style={{width:Math.min(100,Math.max(0,rate))+"%"}}/>:null}
    </div>
    <Link href="/tpo/reports/by-branch" className="mt-3 inline-flex min-h-9 items-center text-xs font-semibold text-[#0a7c88] underline">See branch breakdown</Link>
   </section>
  </aside>
 </div>;
}
