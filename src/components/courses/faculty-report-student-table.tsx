"use client";
import {EmptyState} from "@/components/ui/empty-state";
import {useMemo,useState} from "react";
import {Input} from "@/components/ui/input";
import {DataTable} from "@/components/ui/data-table";
import type {FacultyReportStudentRow} from "@/modules/courses/faculty-report-students";
import {Button} from "@/components/ui/button";

const avatarTints=[
 {bg:"#e0f2f1",fg:"#0f766e"},{bg:"#ede9fe",fg:"#5b21b6"},
 {bg:"#fef3c7",fg:"#92400e"},{bg:"#e0e7ff",fg:"#3730a3"},
 {bg:"#fce7f3",fg:"#9d174d"},{bg:"#dcfce7",fg:"#166534"},
] as const;
function initials(name:string){
 const parts=name.trim().split(/\s+/).filter(Boolean);
 return ((parts.length>=2?parts[0][0]+parts[parts.length-1][0]:parts[0]?.[0])??"?").toUpperCase();
}
function tint(seed:string){
 let hash=0;
 for(const char of seed)hash=(hash*31+char.charCodeAt(0))>>>0;
 return avatarTints[hash%avatarTints.length];
}
function submittedText(value:string|null){
 if(!value)return "—";
 const date=new Date(value);
 if(!Number.isFinite(date.getTime()))return "—";
 return new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",month:"short",day:"numeric",
  hour:"numeric",minute:"2-digit",hour12:true,
 }).format(date);
}
export function FacultyReportStudentTable({rows,title,emptyMessage="No learners have submitted yet."}:{
 rows:readonly FacultyReportStudentRow[];title:string;emptyMessage?:string;
}){
 const [search,setSearch]=useState("");
 const filtered=useMemo(()=>{
  const query=search.trim().toLocaleLowerCase();
  return rows.filter(student=>!query||student.name.toLocaleLowerCase().includes(query))
   .sort((left,right)=>(right.percent??-1)-(left.percent??-1));
 },[rows,search]);
 const clear=()=>setSearch("");
 const missing="No students match “"+search+"”.";
 return <section aria-label={title} className="min-w-0 space-y-3">
  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
   <div>
    <h2 className="text-lg font-semibold text-[var(--lms-heading)]">{title}</h2>
    <p role="status" aria-live="polite" className="mt-1 text-xs text-muted-foreground">
     {filtered.length} {filtered.length===1?"student":"students"} · Highest scores first
    </p>
   </div>
   {rows.length>8?<label className="w-full min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:max-w-sm">
    <span className="sr-only">Search students</span>
    <div className="relative mt-[6px]">
     <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground">
      <circle cx="8" cy="8" r="5"/><path d="m12 12 5 5"/>
     </svg>
     <Input type="search" aria-label="Search students" className="min-h-11 w-full pl-9 pr-10 md:min-h-9"
      placeholder="Search students…" value={search} onChange={event=>setSearch(event.target.value)}/>
     {search?<Button variant="secondary" type="button" onClick={clear} aria-label="Clear student search"
      className="absolute right-1 top-1/2">
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-3"><path d="M3 3l10 10M13 3 3 13"/></svg>
     </Button>:null}
    </div>
   </label>:null}
  </div>
  {rows.length===0?<EmptyState title={emptyMessage}/>:
   filtered.length===0?<div role="status" aria-live="polite"><EmptyState title={missing}/></div>:
   <DataTable caption={title} rows={filtered} getRowKey={student=>student.id}
    mobileMode="cards" empty={<EmptyState title={missing}/>}
    columns={[
     {key:"student",header:"Student",mobilePriority:"primary" as const,
      cell:student=>{
       const colors=tint(student.id||student.name);
       return <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
         style={{backgroundColor:colors.bg,color:colors.fg}}>{initials(student.name)}</span>
        <strong className="min-w-0 break-words text-sm font-semibold text-[var(--lms-heading)]">{student.name||"Unnamed student"}</strong>
       </div>;
      }},
     {key:"score",header:"Score",mobilePriority:"secondary" as const,
      cell:student=>student.percent===null?<span className="text-muted-foreground">—</span>:
       <span className="block">
        <strong className={"block text-base font-semibold tabular-nums "+(student.percent<60?"text-error":"text-[var(--lms-heading)]")}>
         {student.percent}%
        </strong>
        <small className="block text-xs tabular-nums text-muted-foreground">{student.score}</small>
       </span>},
     {key:"submitted",header:"Submitted",mobilePriority:"secondary" as const,
      cell:student=><div className="min-w-0 space-y-1">
       <span className="block tabular-nums" title="Displayed in India Standard Time">{submittedText(student.submittedAt)}</span>
       {/late/i.test(student.note)?<span className="inline-flex rounded-full bg-[#fff7e6] px-2 py-0.5 text-xs font-semibold text-[#ad6800]">Late</span>:null}
       {student.note&& !/^late$/i.test(student.note.trim())?
        <span className="block break-words text-xs text-muted-foreground">{student.note}</span>:null}
      </div>},
    ]}/>
  }
 </section>;
}
