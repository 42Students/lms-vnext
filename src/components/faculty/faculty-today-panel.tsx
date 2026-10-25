"use client";
import {useState} from "react";
import Link from "next/link";

export type FacultyTodayTask = {
 id:string;eyebrow:string;title:string;detail:string;action:string;href:string;
 tone?:"warning"|"neutral";
};
export type FacultyTodayClass = {
 id:string;title:string;sectionName:string;timeLabel:string;location:string|null;
 learnerCount:number|null;href:string;
};
export type FacultyTodayDeadline = {
 id:string;title:string;dateLabel:string;detail:string;href:string;
};

/** Tasks are reloaded from the authorized current teaching scope.
 * "Later" dismisses locally and never pretends to set a persisted reminder. */
export function FacultyTodayPanel({tasks,firstName,dateLabel,nextClass,greeting,dailyClasses,deadlines}:{
 tasks:readonly FacultyTodayTask[];firstName:string;dateLabel:string;
 nextClass:string|null;greeting:string;
 dailyClasses:readonly FacultyTodayClass[];deadlines:readonly FacultyTodayDeadline[];
}){
 const [later,setLater]=useState<string[]>([]);
 const active=tasks.filter(item=>!later.includes(item.id));
 return <section className="faculty-proto-today min-w-0 space-y-5">
  <header>
   <p className="faculty-proto-subtitle">{dateLabel}</p>
   <h1 className="faculty-proto-heading mt-1">
    Good {greeting}{firstName?", "+firstName:""}. {active.length} {active.length===1?"thing needs":"things need"} you.
   </h1>
   <p className="faculty-proto-subtitle mt-1">{nextClass??"Your current classes, grading and deadlines are below."}</p>
  </header>
  <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_308px]">
   <div className="min-w-0">
    {active.length>0?<div className="faculty-proto-task-list">
     {active.map(item=><article key={item.id} className="faculty-proto-task">
      <div className="min-w-0">
       <p className="faculty-proto-task-label" style={item.tone==="warning"?{color:"#b93826"}:undefined}>{item.eyebrow}</p>
       <h2 className="mt-1">{item.title}</h2>
       <p className="faculty-proto-subtitle">{item.detail}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
       <Link className="faculty-proto-action" href={item.href}>{item.action}</Link>
       <button type="button" className="faculty-proto-secondary"
        onClick={()=>setLater(ids=>[...ids,item.id])}
        title="Hide for this visit; does not set a reminder">Later</button>
      </div>
     </article>)}
    </div>:<div className="rounded-xl border border-[#e5ebf2] p-6">
     <h2 className="text-base font-bold text-[#1d293f]">Nothing waiting right now</h2>
     <p className="faculty-proto-subtitle mt-2">Your current teaching priorities are up to date.</p>
     <Link className="faculty-proto-link mt-3 inline-block" href="/teacher/courses">View courses</Link>
    </div>}
    {later.length>0?<button type="button" className="mt-4 text-sm font-semibold text-[#078191] underline"
     onClick={()=>setLater([])}>Show {later.length} hidden {later.length===1?"item":"items"}</button>:null}
   </div>
   <aside className="min-w-0 space-y-4" aria-label="Today's classes and this week">
    <section className="rounded-xl border border-[#e5ebf2] px-5 py-4">
     <div className="flex items-center justify-between gap-3">
      <h2 className="text-xs font-bold uppercase tracking-wide text-[#60718b]">Today&apos;s classes</h2>
      <Link className="faculty-proto-link text-sm" href="/teacher/calendar">Schedule ›</Link>
     </div>
     {dailyClasses.length>0?<ol className="mt-3 divide-y divide-[#edf1f5]">
      {dailyClasses.map((item,index)=><li key={item.id} className="flex items-center justify-between gap-3 py-3">
       <div className="min-w-0">
        <strong className="block text-sm text-[#1d293f]">{item.timeLabel} {item.title} · {item.sectionName}</strong>
        <p className="faculty-proto-subtitle">{item.location??"Room not provided"}{item.learnerCount!==null?" · "+item.learnerCount+" students":""}</p>
       </div>
       <Link className={index===0?"faculty-proto-action shrink-0":"faculty-proto-secondary shrink-0"} href={item.href}>
        {index===0?"Take attendance":"Open"}
       </Link>
      </li>)}
     </ol>:<p className="faculty-proto-subtitle mt-3">No classes scheduled for today.</p>}
    </section>
    <section className="rounded-xl border border-[#e5ebf2] px-5 py-4">
     <h2 className="text-xs font-bold uppercase tracking-wide text-[#60718b]">This week</h2>
     {deadlines.length>0?<ul className="mt-3 divide-y divide-[#edf1f5]">
      {deadlines.map(item=><li key={item.id} className="flex items-start justify-between gap-3 py-3 text-sm">
       <Link className="min-w-0 font-medium text-[#1d293f] hover:underline" href={item.href}>{item.title}</Link>
       <span className="shrink-0 text-xs text-[#60718b]">{item.dateLabel}</span>
      </li>)}
     </ul>:<p className="faculty-proto-subtitle mt-3">No known assignment or quiz deadlines this week.</p>}
    </section>
   </aside>
  </div>
 </section>;
}
