"use client";
import { Checkbox } from "@/components/ui/checkbox";
import {useMemo,useState,useTransition} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Input} from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {collegeInterviewIcs} from "@/modules/placements/college-interview-calendar-model";
import {bookingConflicts,calendarMode,superAdminInterviewCsv,type SuperAdminCalendarRound}
 from "@/modules/admin-ui/super-admin-interview-operations-model";
export function SuperAdminInterviewOperations({events,today,truncated=false}:{events:SuperAdminCalendarRound[];today:string;truncated?:boolean}){
 const [kind,setKind]=useState("ALL"),[status,setStatus]=useState("ALL");
 const [mode,setMode]=useState("ALL"),[department,setDepartment]=useState("ALL"),[conflictsOnly,setConflictsOnly]=useState(false);
 const router=useRouter();
 const [refreshPending,startRefresh]=useTransition();
 const [sort,setSort]=useState("DATE_ASC"),[exportError,setExportError]=useState("");
 const [search,setSearch]=useState(""),[page,setPage]=useState(1),[pageSize,setPageSize]=useState(20);
 const change=(setter:(value:string)=>void)=>(value:string)=>{setter(value);setPage(1);};
 const companyTone=(name:string)=>["bg-primary-subtle","bg-warning-subtle","bg-success-subtle","bg-muted"][
  [...name].reduce((acc,char)=>(acc*33+char.charCodeAt(0))>>>0,5381)%4];
 const icsHref=(e:SuperAdminCalendarRound)=>"data:text/calendar;charset=utf-8,"+encodeURIComponent(collegeInterviewIcs({
  id:e.id,title:e.title,date:e.startsAt,location:e.venue??e.meetingUrl??null,
  durationMinutes:e.endsAt?Math.max(1,Math.round((Date.parse(e.endsAt)-Date.parse(e.startsAt))/60000)):30,
 }));
 const conflicts=useMemo(()=>bookingConflicts(events),[events]);
 const filtered=useMemo(()=>events.filter(e=>
  (kind==="ALL"||e.kind===kind)&&(status==="ALL"||e.status===status)&&
  (mode==="ALL"||calendarMode(e)===mode)&&
  (department==="ALL"||(e.departmentName??"Not recorded")===department)&&
  (!conflictsOnly||conflicts.has(e.id))&&(!search.trim()||[
    e.candidateName,e.jobTitle,e.companyName,e.title,e.venue,
   ].some(text=>text?.toLocaleLowerCase("en-IN").includes(search.trim().toLocaleLowerCase("en-IN"))))
 ).sort((a,b)=>{
  if(sort==="JOB_TITLE")return (a.jobTitle??"").localeCompare(b.jobTitle??"")||a.startsAt.localeCompare(b.startsAt);
  if(sort==="STATUS")return a.status.localeCompare(b.status)||a.startsAt.localeCompare(b.startsAt);
  if(sort==="DATE_DESC")return b.startsAt.localeCompare(a.startsAt)||a.id.localeCompare(b.id);
  return a.startsAt.localeCompare(b.startsAt)||a.id.localeCompare(b.id);
 }),[events,kind,status,mode,department,conflictsOnly,sort,conflicts,search]);
 const exported=useMemo(()=>filtered.slice(0,500),[filtered]);
 const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));
 const currentPage=Math.min(page,totalPages);
 const pageRows=filtered.slice((currentPage-1)*pageSize,currentPage*pageSize);
 const csv=useMemo(()=>superAdminInterviewCsv(exported),[exported]);
 const unique=(values:string[])=>[...new Set(values)].sort();
 const choices=(label:string,items:string[],value:string,change:(v:string)=>void)=>
  <label className="grid min-w-0 gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">{label}
   <Select className="min-h-11 min-[768px]:min-h-9" value={value}
    onChange={e=>change(e.target.value)}>
    <option value="ALL">All</option>{items.map(i=><option key={i} value={i}>{i}</option>)}
   </Select>
  </label>;
 const dateInIst=(iso:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(iso));
 const inIst=(iso:string)=>new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(new Date(iso));
 return <section aria-label="Interview operations" className="min-w-0 space-y-[var(--lms-space-4)] border-b border-border pb-[var(--lms-space-4)]">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><h2 className="font-semibold text-[var(--lms-heading)]">Interviews</h2>
    <p className="mt-1 text-xs text-muted-foreground">All companies · Confirmed appointments</p>
   </div>
   <Button variant="secondary" disabled={refreshPending} onClick={()=>startRefresh(()=>router.refresh())} type="button">{refreshPending?"Refreshing…":"↻ Refresh"}</Button>
  </div>
  <dl className="grid min-w-0 grid-cols-2 border-y border-border sm:grid-cols-4">
   {([["Scheduled",events.filter(x=>x.status==="SCHEDULED").length],["Today",events.filter(x=>dateInIst(x.startsAt)===today).length],
    ["Companies",new Set(events.map(x=>x.companyName)).size],["Possible venue conflicts",conflicts.size]] as const)
    .map(([label,value])=><div key={label} className="min-w-0 border-b border-r border-border p-[var(--lms-space-3)]">
     <dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-xl font-semibold tabular-nums">{value}</dd>
    </div>)}
  </dl>
  <div className="min-w-0 space-y-[var(--lms-space-3)] print:hidden">
   <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] sm:grid-cols-2">
    {choices("Type",unique(events.map(x=>x.kind)),kind,change(setKind))}
    {choices("Status",unique(events.map(x=>x.status)),status,change(setStatus))}
   </div>
   <label className="grid min-w-0 gap-2 text-[13px] font-semibold text-body">Search candidates, jobs or companies
    <Input type="search" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
     maxLength={120} placeholder="Search interviews" className="min-h-11 md:min-h-9"/>
   </label>
   <details className="min-w-0" open={mode!=="ALL"||department!=="ALL"||sort!=="DATE_ASC"||conflictsOnly}>
    <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Filters</summary>
    <div className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] pt-[var(--lms-space-2)] sm:grid-cols-2 lg:grid-cols-3">
     {choices("Mode",unique(events.map(calendarMode)),mode,change(setMode))}
     {choices("Department",unique(events.map(x=>x.departmentName??"Not recorded")),department,change(setDepartment))}
     <label className="grid min-w-0 gap-2 text-[13px] font-semibold text-body">Sort by
       <Select value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}} className="min-h-11 md:min-h-9">
        <option value="DATE_ASC">Date ↑ Earliest</option>
        <option value="DATE_DESC">Date ↓ Latest</option>
        <option value="JOB_TITLE">Job title</option>
        <option value="STATUS">Status</option>
       </Select>
     </label>
     <label className="flex min-h-11 items-center gap-2 text-sm text-body">
      <Checkbox checked={conflictsOnly} onChange={e=>{setConflictsOnly(e.target.checked);setPage(1);}}/>
      Possible conflicts only
     </label>
    </div>
   </details>
   <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>{
    setKind("ALL");setStatus("ALL");setMode("ALL");setDepartment("ALL");setConflictsOnly(false);setSort("DATE_ASC");setSearch("");setPage(1);
   }}>Clear filters</Button>
  </div>
  <p role="status" aria-live="polite" className="text-sm text-body leading-[22px]">{filtered.length} matching candidate interview bookings. Department filter uses the applicant’s currently active academic program; historical departments may be unrecorded.{truncated?" First 2,000 bookings shown; narrow the date range.":""}</p>
  <a download="interviews.csv" href={filtered.length?"data:text/csv;charset=utf-8,"+encodeURIComponent("\ufeff"+csv):undefined}
   onClick={e=>{if(!filtered.length){e.preventDefault();setExportError("No interviews match the selected filters. Clear filters to export.");}else setExportError("");}}
   className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 print:hidden">Export interviews.csv</a>
  {filtered.length>500?<p role="status" className="text-sm text-muted-foreground leading-[22px]">Export includes the first 500 visible rounds. Narrow filters for the remaining records.</p>:null}
  {exportError?<p role="alert" className="border-l-2 border-error bg-error-subtle px-4 py-3 text-sm text-error leading-[22px]">{exportError}</p>:null}
  {!filtered.length?<p className="border-b border-border py-4">No interviews match these filters. Clear filters to see all appointments.</p>:
   <>
    <ul aria-label="Mobile interview appointments" className="divide-y divide-border border-y border-border md:hidden">
     {pageRows.map(row=><li key={row.id} className="space-y-2 py-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <strong>{row.candidateName??"Candidate not recorded"}</strong>
       <span className="rounded border border-border px-2 py-1 text-xs">{row.status==="SCHEDULED"?"Confirmed":row.status.replaceAll("_"," ")}</span>
      </div>
      <p className="font-semibold">{row.jobTitle??row.title}</p>
      <span className={"inline-block rounded border border-border px-2 py-1 text-xs "+companyTone(row.companyName)}>{row.companyName}</span>
      <p className="text-xs text-body">{inIst(row.startsAt)} IST · {calendarMode(row)}</p>
      {row.venue?<p className="text-xs text-body">Venue: {row.venue}</p>:null}
      {row.meetingUrl?<a href={row.meetingUrl} target="_blank" rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center font-semibold text-link underline">Join online interview</a>:null}
      <div className="flex flex-wrap gap-4">
       {row.jobId?<Link href={"/admin/placements/jobs/"+encodeURIComponent(row.jobId)+"/schedule"}
        aria-label={"View interview for "+(row.candidateName??"candidate")+" · "+(row.jobTitle??row.title)}
        className="inline-flex min-h-11 items-center font-semibold text-link underline">View</Link>:null}
       <a download={"interview-"+row.id+".ics"} href={icsHref(row)}
        aria-label={"Download calendar invitation for "+(row.candidateName??"candidate")+" · "+(row.jobTitle??row.title)}
        className="inline-flex min-h-11 items-center font-semibold text-link underline">.ics</a>
      </div>
     </li>)}
    </ul>
    <div className="hidden min-w-0 overflow-x-auto md:block"><DataTable<SuperAdminCalendarRound>
    rows={pageRows} getRowKey={row=>row.id}
    caption="Candidate interview bookings" empty={<p>No interviews match these filters. Clear filters to see all rounds.</p>}
    columns={[
     {key:"candidate",header:"Candidate",mobilePriority:"primary",cell:row=>row.candidateName??"Not recorded"},
     {key:"department",header:"Department",mobilePriority:"secondary",cell:row=>row.departmentName??"Not recorded"},
     {key:"round",header:"Round",mobilePriority:"secondary",cell:row=>row.title},
     {key:"company",header:"Company",mobilePriority:"secondary",cell:row=><span className={"rounded px-2 py-1 text-xs "+companyTone(row.companyName)}>{row.companyName}</span>},
     {key:"date",header:"Date (IST)",mobilePriority:"secondary",cell:row=>inIst(row.startsAt)},
     {key:"type",header:"Type",mobilePriority:"secondary",cell:row=>row.kind},
     {key:"mode",header:"Mode",mobilePriority:"secondary",cell:row=>calendarMode(row)},
     {key:"interviewer",header:"Interviewer",mobilePriority:"secondary",cell:row=>row.interviewer??"Not recorded"},
     {key:"status",header:"Status",mobilePriority:"secondary",cell:row=><>
      {row.status==="SCHEDULED"?"Confirmed":row.status}{conflicts.has(row.id)?<strong className="block text-warning">{conflicts.get(row.id)?.join("; ")}</strong>:null}
     </>},
     {key:"venue",header:"Venue",mobilePriority:"secondary",cell:row=>row.venue??"Not recorded"},
     {key:"actions",header:"Actions",mobilePriority:"action",cell:row=><div className="flex min-w-0 flex-wrap gap-[var(--lms-space-2)]">
      {row.jobId?<Link className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 print:hidden"
       href={"/admin/placements/jobs/"+encodeURIComponent(row.jobId)+"/schedule"}>Open schedule</Link>:null}
      <a className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 print:hidden"
       download={"interview-"+row.id+".ics"}
       href={icsHref(row)}>.ics</a>
     </div>},
    ]}
   /></div>
    <nav aria-label="Interview pages" className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
     <p className="text-sm text-body">Showing {filtered.length?((currentPage-1)*pageSize+1):0}–{Math.min(currentPage*pageSize,filtered.length)} of {filtered.length} appointments</p>
     <div className="flex flex-wrap items-center gap-2">
      <label className="text-sm text-body">Rows per page
       <Select value={String(pageSize)} onChange={e=>{setPageSize(Number(e.target.value));setPage(1);}} className="ml-2 min-h-11 md:min-h-9">
        {[10,20,50,100].map(n=><option key={n} value={n}>{n}</option>)}
       </Select>
      </label>
      <Button type="button" variant="secondary" disabled={currentPage<=1} onClick={()=>setPage(n=>Math.max(1,n-1))}>Previous</Button>
      <span className="text-sm tabular-nums">{currentPage}/{totalPages}</span>
      <Button type="button" variant="secondary" disabled={currentPage>=totalPages} onClick={()=>setPage(n=>Math.min(totalPages,n+1))}>Next</Button>
     </div>
    </nav>
   </>}
 </section>;
}
