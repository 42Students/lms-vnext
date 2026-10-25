"use client";

import {useState} from "react";
import Link from "next/link";

export type FacultyTodayTask = {
  id:string;
  eyebrow:string;
  title:string;
  detail:string;
  action:string;
  href:string;
  tone?:"warning"|"neutral";
};

/** "Later" hides an item in the current view only; there is no fabricated
 * server-side snooze record or simulated unread count. */
export function FacultyTodayPanel({tasks,firstName,dateLabel,nextClass}:{
  tasks:readonly FacultyTodayTask[];
  firstName:string;
  dateLabel:string;
  nextClass:string|null;
}){
 const [later,setLater]=useState<string[]>([]);
 const active=tasks.filter(item=>!later.includes(item.id));
 return <section className="mx-auto max-w-5xl min-w-0">
  <p className="faculty-proto-subtitle">{dateLabel}</p>
  <h1 className="faculty-proto-heading mt-2">
    Good {new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"}{firstName?", "+firstName:""}. {active.length} {active.length===1?"thing needs":"things need"} you.
  </h1>
  <p className="mt-1 mb-6 text-base text-[#40516a]">
    {nextClass??"Your teaching priorities and upcoming classes."}
  </p>
  {active.length>0?<div className="faculty-proto-task-list">
   {active.map(item=><article key={item.id} className="faculty-proto-task">
    <div className="min-w-0">
     <p className="faculty-proto-task-label" style={item.tone==="warning"?{color:"#b93826"}:undefined}>{item.eyebrow}</p>
     <h2 className="mt-1">{item.title}</h2>
     <p className="faculty-proto-subtitle">{item.detail}</p>
    </div>
    <div className="flex shrink-0 flex-wrap gap-2">
     <Link className="faculty-proto-action" href={item.href}>{item.action}</Link>
     <button type="button" className="faculty-proto-secondary" onClick={()=>setLater(ids=>[...ids,item.id])}
      title="Hide for this visit; no reminder is scheduled">Later</button>
    </div>
   </article>)}
  </div>:<p className="rounded-xl border border-[#e5ebf2] p-6 text-sm text-[#60718b]">
    Nothing waiting in this view. Check your courses for more work.
  </p>}
  {later.length>0?<button type="button" className="mt-4 text-sm font-semibold text-[#078191] underline"
    onClick={()=>setLater([])}>Show {later.length} hidden {later.length===1?"item":"items"}</button>:null}
 </section>;
}
