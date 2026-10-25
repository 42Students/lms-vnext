"use client";
import {useState} from "react";
import Link from "next/link";
export type FacultyCalendarItem={id:string;title:string;sectionName:string;courseCode:string|null;
 startsAt:string;location:string|null;deliveryId:string|null};
function istDay(instant:string):string{
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",day:"2-digit",month:"2-digit",year:"numeric"}).formatToParts(new Date(instant));
 const part=(name:string)=>parts.find(p=>p.type===name)?.value??"";
 return part("year")+"-"+part("month")+"-"+part("day");
}
const date=(key:string)=>new Date(key+"T12:00:00Z");
const shift=(key:string,n:number)=>{const d=date(key);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const monday=(key:string)=>shift(key,-((date(key).getUTCDay()+6)%7));
const dayLabel=(key:string)=>new Intl.DateTimeFormat("en-GB",{timeZone:"UTC",weekday:"short",day:"numeric"}).format(date(key));
const localTime=(raw:string)=>new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",hour12:true}).format(new Date(raw));
/** Faculty screenshot schedule: only dates backed by the bounded persisted query. */
export function FacultyPrototypeSchedule({events,nowIso,minDate,maxDate}:{
 events:readonly FacultyCalendarItem[];nowIso:string;minDate:string;maxDate:string;
}){
 const today=istDay(nowIso);
 const [view,setView]=useState<"Week"|"Day"|"Month">("Week");
 const [day,setDay]=useState(today);
 const [course,setCourse]=useState("all");
 const courses=[...new Set(events.flatMap(item=>item.courseCode?[item.courseCode]:[]))].sort();
 const selectedEvents=events.filter(item=>course==="all"||item.courseCode===course);
 const monthStart=day.slice(0,7)+"-01";
 const nextMonth=new Date(Date.UTC(Number(day.slice(0,4)),Number(day.slice(5,7)),1));
 const monthDays=Math.ceil((Number(shift(nextMonth.toISOString().slice(0,10),-1).slice(8))+(date(monthStart).getUTCDay()+6)%7)/7)*7;
 const start=view==="Month"?monday(monthStart):view==="Week"?monday(day):day;
 const keys=Array.from({length:view==="Month"?monthDays:view==="Week"?7:1},(_,i)=>shift(start,i));
 const ordered=[...new Map(selectedEvents.filter(item=>new Date(item.startsAt)>=new Date(nowIso))
  .sort((a,b)=>a.startsAt.localeCompare(b.startsAt)).map(item=>[item.id,item] as const)).values()].slice(0,3);
 const monthJump=(delta:number)=>new Date(Date.UTC(Number(day.slice(0,4)),Number(day.slice(5,7))-1+delta,1)).toISOString().slice(0,10);
 const previous=view==="Month"?monthJump(-1):shift(day,view==="Week"?-7:-1);
 const next=view==="Month"?monthJump(1):shift(day,view==="Week"?7:1);
 return <section className="space-y-5" aria-label="Faculty class schedule prototype">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div><h1 className="faculty-proto-heading">Class schedule</h1>
    <p className="faculty-proto-subtitle mt-1">{selectedEvents.length} scheduled classes in the loaded window · times shown in IST</p></div>
   <div className="flex flex-wrap gap-2" role="group" aria-label="Calendar views">
    {(["Week","Day","Month"] as const).map(v=><button key={v} type="button"
      className="faculty-proto-pill" aria-pressed={view===v} onClick={()=>setView(v)}>{v}</button>)}
    <label className="sr-only" htmlFor="faculty-calendar-course">Filter class schedule by course</label>
    <select id="faculty-calendar-course" value={course} onChange={e=>setCourse(e.target.value)}
     className="min-h-11 rounded-lg border border-[#dce5ee] bg-white px-3 text-sm">
     <option value="all">All courses</option>
     {courses.map(code=><option key={code} value={code}>{code}</option>)}
    </select>
    <span className="self-center text-sm font-semibold text-[#1d293f]">
     {new Intl.DateTimeFormat("en-IN",{timeZone:"UTC",day:"numeric",month:"short"}).format(date(keys[0]!))}
     {" – "}
     {new Intl.DateTimeFormat("en-IN",{timeZone:"UTC",day:"numeric",month:"short"}).format(date(keys.at(-1)!))}
    </span>
    <button type="button" className="faculty-proto-secondary" disabled={previous<minDate}
      onClick={()=>setDay(previous)} aria-label={"Previous "+view}>←</button>
    <button type="button" className="faculty-proto-secondary" onClick={()=>setDay(today)}>Today</button>
    <button type="button" className="faculty-proto-secondary" disabled={next>maxDate}
      onClick={()=>setDay(next)} aria-label={"Next "+view}>→</button>
   </div>
  </div>
  <div className="overflow-x-auto">
   <div className="grid min-w-[820px] gap-2" style={{gridTemplateColumns:view==="Day"?"1fr":"repeat(7,minmax(0,1fr))"}}>
    {keys.map(key=><section key={key} aria-label={key+" IST"} className={"min-h-52 rounded-xl border p-3 "+(key===today?"border-[#078191] bg-[#f1f9fa]":"border-[#e5ebf2]")}>
     <h2 className={"text-sm font-bold "+(key===today?"text-[#078191]":"text-[#1d293f]")}>{dayLabel(key)}{key===today?" · today":""}</h2>
     {selectedEvents.filter(e=>istDay(e.startsAt)===key).map((e,i)=><article key={e.id+":"+(e.deliveryId??"section")} className={"mt-3 rounded-md border-l-[3px] px-2 py-2 text-xs "+(i%2?"border-[#7743d1] bg-[#f5f1fc]":"border-[#078191] bg-[#eaf5f7]")}>
      <p className="font-bold">{localTime(e.startsAt)} · {e.courseCode??e.title}</p>
      <p>{e.sectionName}</p>
      {e.location?<p className="mt-1 text-[#60718b]">{e.location}</p>:null}
      {e.deliveryId?<Link className="faculty-proto-link mt-2 inline-block" href={"/teacher/courses/"+encodeURIComponent(e.deliveryId)+"/attendanceDetail"}>Attendance</Link>:null}
     </article>)}
     {!selectedEvents.some(e=>istDay(e.startsAt)===key)?<p className="mt-3 text-xs text-[#98a5b8]">No scheduled classes</p>:null}
    </section>)}
   </div>
  </div>
  <section className="rounded-xl border border-[#e5ebf2] p-5">
   <h2 className="text-xs font-bold uppercase text-[#60718b]">Next 3 classes</h2>
   {ordered.length?<ol className="mt-2 divide-y divide-[#e5ebf2]">{ordered.map(e=><li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
    <span><strong>{dayLabel(istDay(e.startsAt))} {localTime(e.startsAt)}</strong> · {e.title} · {e.sectionName}{e.location?" · "+e.location:""}</span>
    {e.deliveryId?<Link className="faculty-proto-link" href={"/teacher/courses/"+encodeURIComponent(e.deliveryId)+"/attendanceDetail"}>Mark attendance</Link>:null}
   </li>)}</ol>:<p className="faculty-proto-subtitle mt-2">No upcoming classes in the verified timetable window.</p>}
  </section>
  <p className="faculty-proto-subtitle">The timetable is set by your college admin. This view shows a bounded verified date range; use the advanced calendar for other dates.</p>
 </section>;
}
