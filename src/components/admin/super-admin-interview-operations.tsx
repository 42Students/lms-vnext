"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {collegeInterviewIcs} from "@/modules/placements/college-interview-calendar-model";
import {bookingConflicts,calendarMode,superAdminInterviewCsv,type SuperAdminCalendarRound}
 from "@/modules/admin-ui/super-admin-interview-operations-model";
export function SuperAdminInterviewOperations({events,today,truncated=false}:{events:SuperAdminCalendarRound[];today:string;truncated?:boolean}){
 const [kind,setKind]=useState("ALL"),[status,setStatus]=useState("ALL");
 const [mode,setMode]=useState("ALL"),[department,setDepartment]=useState("ALL"),[conflictsOnly,setConflictsOnly]=useState(false);
 const [sort,setSort]=useState("DATE"),[exportError,setExportError]=useState("");
 const conflicts=useMemo(()=>bookingConflicts(events),[events]);
 const filtered=useMemo(()=>events.filter(e=>
  (kind==="ALL"||e.kind===kind)&&(status==="ALL"||e.status===status)&&
  (mode==="ALL"||calendarMode(e)===mode)&&
  (department==="ALL"||(e.departmentName??"Not recorded")===department)&&
  (!conflictsOnly||conflicts.has(e.id))
 ).sort((a,b)=>sort==="COMPANY"?a.companyName.localeCompare(b.companyName):a.startsAt.localeCompare(b.startsAt)),[events,kind,status,mode,department,conflictsOnly,sort,conflicts]);
 const exported=useMemo(()=>filtered.slice(0,500),[filtered]);
 const csv=useMemo(()=>superAdminInterviewCsv(exported),[exported]);
 const unique=(values:string[])=>[...new Set(values)].sort();
 const choices=(label:string,items:string[],value:string,change:(v:string)=>void)=>
  <label className="grid min-w-36 gap-1 text-sm font-semibold">{label}
   <select className="min-h-11 rounded border border-border bg-surface p-2" value={value}
    onChange={e=>change(e.target.value)}>
    <option value="ALL">All</option>{items.map(i=><option key={i} value={i}>{i}</option>)}
   </select>
  </label>;
 const dateInIst=(iso:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(iso));
 const inIst=(iso:string)=>new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(new Date(iso));
 return <section aria-label="Interview operations" className="space-y-4 rounded-xl border border-border bg-surface p-4">
  <h2 className="font-semibold">Interview operations</h2>
  <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
   {([["Scheduled",events.filter(x=>x.status==="SCHEDULED").length],["Today",events.filter(x=>dateInIst(x.startsAt)===today).length],
    ["Companies",new Set(events.map(x=>x.companyName)).size],["Possible venue conflicts",conflicts.size]] as const)
    .map(([label,value])=><div key={label} className="min-w-0 rounded border border-border p-3">
     <dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-xl font-semibold tabular-nums">{value}</dd>
    </div>)}
  </dl>
  <div className="flex flex-wrap items-end gap-3">
   {choices("Type",unique(events.map(x=>x.kind)),kind,setKind)}
   {choices("Status",unique(events.map(x=>x.status)),status,setStatus)}
   {choices("Mode",unique(events.map(calendarMode)),mode,setMode)}
   {choices("Department",unique(events.map(x=>x.departmentName??"Not recorded")),department,setDepartment)}
   {choices("Sort",["DATE","COMPANY"],sort,setSort)}
   <label className="flex min-h-11 items-center gap-2 text-sm">
    <input type="checkbox" checked={conflictsOnly} onChange={e=>setConflictsOnly(e.target.checked)}/>
    Possible conflicts only
   </label>
   <button type="button" className="min-h-11 rounded border border-border px-4 font-semibold" onClick={()=>{
     setKind("ALL");setStatus("ALL");setMode("ALL");setDepartment("ALL");setConflictsOnly(false);setSort("DATE");
   }}>Clear filters</button>
  </div>
  <p role="status" aria-live="polite">{filtered.length} matching candidate interview bookings. Department filter uses the applicant’s currently active academic program; historical departments may be unrecorded.{truncated?" First 2,000 bookings shown; narrow the date range.":""}</p>
  <a download="interviews.csv" href={filtered.length?"data:text/csv;charset=utf-8,"+encodeURIComponent("\ufeff"+csv):undefined}
   onClick={e=>{if(!filtered.length){e.preventDefault();setExportError("No interviews match the selected filters. Clear filters to export.");}else setExportError("");}}
   className="inline-flex min-h-11 items-center rounded border border-border px-4 font-semibold text-primary-text focus-visible:ring-2 focus-visible:ring-primary">Export interviews.csv</a>
  {filtered.length>500?<p role="status" className="text-sm text-muted-foreground">Export includes the first 500 visible rounds. Narrow filters for the remaining records.</p>:null}
  {exportError?<p role="alert">{exportError}</p>:null}
  {!filtered.length?<p className="rounded border border-border p-4">No interviews match these filters. Clear filters to see all rounds.</p>:
   <div className="overflow-x-auto"><table className="w-full min-w-[55rem] text-left text-sm">
    <thead><tr className="border-b border-border"><th className="p-2">Candidate</th><th className="p-2">Department</th><th className="p-2">Round</th><th className="p-2">Company</th><th className="p-2">Date (IST)</th><th className="p-2">Type</th><th className="p-2">Mode</th><th className="p-2">Interviewer</th><th className="p-2">Status</th><th className="p-2">Venue</th><th className="p-2">Actions</th></tr></thead>
    <tbody>{filtered.map(row=><tr key={row.id} className="border-b border-border">
     <td className="p-2">{row.candidateName??"Not recorded"}</td><td className="p-2">{row.departmentName??"Not recorded"}</td><td className="p-2">{row.title}</td><td className="p-2">{row.companyName}</td>
     <td className="p-2">{inIst(row.startsAt)}</td><td className="p-2">{row.kind}</td>
     <td className="p-2">{calendarMode(row)}</td><td className="p-2">{row.interviewer??"Not recorded"}</td>
     <td className="p-2">{row.status}{conflicts.has(row.id)?<strong className="block text-warning">{conflicts.get(row.id)?.join("; ")}</strong>:null}</td>
     <td className="p-2">{row.venue??"Not recorded"}</td>
     <td className="p-2"><div className="flex flex-wrap gap-2">
      {row.jobId?<Link className="font-semibold text-primary-text underline" href={"/admin/placements/jobs/"+encodeURIComponent(row.jobId)+"/schedule"}>Open schedule</Link>:null}
      <a className="font-semibold text-primary-text underline" download={"interview-"+row.id+".ics"}
       href={"data:text/calendar;charset=utf-8,"+encodeURIComponent(collegeInterviewIcs({id:row.id,title:row.title,date:row.startsAt,durationMinutes:row.endsAt?Math.max(1,Math.round((Date.parse(row.endsAt)-Date.parse(row.startsAt))/60000)):30,location:row.venue}))}>.ics</a>
     </div></td>
    </tr>)}</tbody>
   </table></div>}
 </section>;
}
