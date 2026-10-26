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
 const todayClasses=selectedEvents.filter(item=>istDay(item.startsAt)===today).length;
 const nowMs=Date.parse(nowIso);
 const currentWeekStart=monday(today);
 const thisWeekClasses=selectedEvents.filter(item=>{
  const key=istDay(item.startsAt);
  return key>=currentWeekStart&&key<=shift(currentWeekStart,6);
 }).length;
 const nextClass=selectedEvents.filter(item=>Date.parse(item.startsAt)>nowMs)
  .sort((a,b)=>a.startsAt.localeCompare(b.startsAt))[0]??null;
 const timeToNext=nextClass?Math.max(0,Math.round((Date.parse(nextClass.startsAt)-nowMs)/60000)):null;
 const nextMessage=timeToNext===null?"no upcoming class in the loaded window":
  timeToNext<60?"next class in "+timeToNext+" minutes":
  "next class in "+Math.floor(timeToNext/60)+" hour"+(Math.floor(timeToNext/60)===1?"":"s")+
   (timeToNext%60?" "+timeToNext%60+" minutes":"");
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
   <div><h2 className="sr-only">Calendar views and schedule</h2>
    <p className="faculty-proto-subtitle mt-1">
     {todayClasses} {todayClasses===1?"class":"classes"} today · {thisWeekClasses} this week · {nextMessage}
    </p></div>
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
  <div className="overflow-x-auto" role="region" aria-label="Calendar dates, scroll horizontally for other days" tabIndex={0}>
   <div className="grid min-w-[800px] gap-[6px]" style={{gridTemplateColumns:view==="Day"?"1fr":"repeat(7,minmax(0,1fr))"}}>
    {keys.map(key=><section key={key} aria-label={key+" IST"} className={"min-h-[264px] rounded-xl border p-2.5 "+(key===today?"border-[#69b5be] bg-[#f1f9fa]":"border-[#e5ebf2]")}>
     <h2 className={"text-sm font-bold "+(key===today?"text-[#078191]":"text-[#1d293f]")}>{dayLabel(key)}{key===today?" · today":""}</h2>
     {selectedEvents.filter(e=>istDay(e.startsAt)===key).map((e,i)=>{
      const tone=["border-[#078191] bg-[#eef8f9]","border-[#e79c00] bg-[#fff9eb]","border-[#7447df] bg-[#f6f2ff]"][
       [...(e.courseCode??e.title)].reduce((n,char)=>n+char.charCodeAt(0),0)%3]!;
      return <article key={e.id+":"+(e.deliveryId??"section")+":"+i}
       className={"mt-2 rounded-md border-l-[3px] px-2 py-2 text-xs "+tone}>
      <p className="font-semibold text-[#1d293f]">{localTime(e.startsAt)} · {e.courseCode??e.title} · {e.sectionName}</p>
      {e.location?<p className="mt-1 text-[#334155]">{e.location}</p>:null}
      {e.deliveryId?<Link className="faculty-proto-link mt-1 inline-block"
       href={"/teacher/courses/"+encodeURIComponent(e.deliveryId)+"/attendanceDetail?sessionId="+encodeURIComponent(e.id)}>
        Take attendance</Link>:null}
     </article>})}
     {!selectedEvents.some(e=>istDay(e.startsAt)===key)?<p className="mt-3 text-xs text-[#98a5b8]">No scheduled classes</p>:null}
    </section>)}
   </div>
  </div>
  <section className="rounded-xl border border-[#e5ebf2] p-5">
   <h2 className="text-xs font-bold uppercase text-[#60718b]">Next 3 classes</h2>
   {ordered.length?<ol className="mt-2 divide-y divide-[#e5ebf2]">{ordered.map(e=><li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
    <span><strong>{istDay(e.startsAt)===today?"Today":dayLabel(istDay(e.startsAt))} {localTime(e.startsAt)}</strong> · {e.courseCode??e.title} · {e.sectionName}{e.location?" · "+e.location:""}</span>
    {e.deliveryId?<Link className="faculty-proto-link" href={"/teacher/courses/"+encodeURIComponent(e.deliveryId)+"/attendanceDetail?sessionId="+encodeURIComponent(e.id)}>Take attendance</Link>:null}
   </li>)}</ol>:<p className="faculty-proto-subtitle mt-2">No upcoming classes in the verified timetable window.</p>}
  </section>
  <p className="faculty-proto-subtitle">The schedule is set by the college admin. To change a class, ask them; you can mark attendance on any scheduled class day. Open the advanced calendar for dates outside this loaded window.</p>
 </section>;
}
