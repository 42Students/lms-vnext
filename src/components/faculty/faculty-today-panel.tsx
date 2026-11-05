"use client";
import {useState} from "react";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";

export type FacultyTodayTask = {
 id:string;eyebrow:string;title:string;detail:string;action:string;href:string;
 tone?:"warning"|"neutral";
};
export type FacultyTodayClass = {
 id:string;title:string;sectionName:string;timeLabel:string;location:string|null;
 learnerCount:number|null;href:string;actionLabel:string;
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
   <Heading level={1} className="faculty-proto-heading mt-1">
    Good {greeting}{firstName?", "+firstName:""}. {active.length} {active.length===1?"thing needs":"things need"} you.
   </Heading>
   <p className="faculty-proto-subtitle mt-1">{nextClass??"Your current classes, grading and deadlines are below."}</p>
  </header>
  <div className="grid min-w-0 items-start gap-[20px] xl:grid-cols-[minmax(0,1fr)_300px]">
   <div className="min-w-0">
    {active.length>0?<div className="faculty-proto-task-list">
     {active.map(item=><article key={item.id} className="faculty-proto-task">
      <div className="min-w-0">
       <p className="faculty-proto-task-label" style={item.tone==="warning"?{color:"var(--lms-error-text)"}:undefined}>{item.eyebrow}</p>
       <Heading level={2} className="mt-1">{item.title}</Heading>
       <p className="faculty-proto-subtitle">{item.detail}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
       <TextLink variant="bare" className="faculty-proto-action" href={item.href}>{item.action}</TextLink>
       <Button variant="secondary" type="button"
        onClick={()=>setLater(ids=>[...ids,item.id])}
        title="Hide for this visit; does not set a reminder">Later</Button>
      </div>
     </article>)}
    </div>:<div className="rounded-xl border border-[color:var(--lms-border)] p-6">
     <Heading level={2} className="faculty-proto-empty-heading">Nothing waiting right now</Heading>
     <p className="faculty-proto-subtitle mt-2">Your current teaching priorities are up to date.</p>
     <TextLink variant="bare" className="faculty-proto-link mt-3 inline-block" href="/teacher/courses">View courses</TextLink>
    </div>}
    {later.length>0?<Button variant="link" size="inline" type="button" className="mt-4"
     onClick={()=>setLater([])}>Show {later.length} hidden {later.length===1?"item":"items"}</Button>:null}
   </div>
   <aside className="grid min-w-0 gap-4" aria-label="Today's classes and this week">
    <section className="rounded-[12px] border border-[color:var(--lms-border)] px-[16px] py-4">
     <div className="flex items-center justify-between gap-3">
      <Heading level={2} size="xs" className="uppercase tracking-wide text-[color:var(--lms-text-muted)]">Today&apos;s classes</Heading>
      <TextLink variant="bare" className="faculty-proto-link text-sm" href="/teacher/calendar">Schedule ›</TextLink>
     </div>
     {dailyClasses.length>0?<ol className="mt-3 divide-y divide-[color:var(--lms-neutral-100)]">
      {dailyClasses.map((item,index)=><li key={item.id} className="flex items-center justify-between gap-3 py-3">
       <div className="min-w-0">
        <TextLink className="block text-sm text-[color:var(--lms-heading)]" href={item.href}>{item.timeLabel} {item.title} · {item.sectionName}</TextLink>
        <p className="faculty-proto-subtitle">{item.location??"Room not provided"}{item.learnerCount!==null?" · "+item.learnerCount+" students":""}</p>
       </div>
       {index===0?<TextLink variant="bare" className="faculty-proto-action shrink-0 min-h-[36px] px-[12px] py-[6px] text-xs" href={item.href}>{item.actionLabel}</TextLink>:
        <span className="shrink-0 rounded-md bg-[color:var(--lms-neutral-100)] px-2 py-1 text-xs font-semibold text-[color:var(--lms-text-muted)]" title="Later scheduled class">Later</span>}
      </li>)}
     </ol>:<p className="faculty-proto-subtitle mt-3">No classes scheduled for today.</p>}
    </section>
    <section className="rounded-[12px] border border-[color:var(--lms-border)] px-[16px] py-4">
     <Heading level={2} size="xs" className="uppercase tracking-wide text-[color:var(--lms-text-muted)]">This week</Heading>
     {deadlines.length>0?<ul className="mt-2 divide-y divide-[color:var(--lms-neutral-100)]">
      {deadlines.map(item=><li key={item.id} className="flex items-start justify-between gap-3 py-3 text-sm">
       <TextLink className="min-w-0 text-[color:var(--lms-heading)]" href={item.href}>{item.title}</TextLink>
       <span className="shrink-0 text-xs text-[color:var(--lms-text-muted)]">{item.dateLabel}</span>
      </li>)}
     </ul>:<p className="faculty-proto-subtitle mt-3">No known assignment or quiz deadlines this week.</p>}
    </section>
   </aside>
  </div>
 </section>;
}
