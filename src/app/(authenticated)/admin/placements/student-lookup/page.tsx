import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import {DataTable} from "@/components/ui/data-table";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {StatusBadge} from "@/components/ui/status-badge";
import {EmptyState} from "@/components/ui/empty-state";
import {lookupCollegeStudentPlacement} from "@/modules/placements/college-placement-student-lookup-service";
import {parseSuperAdminPlacementStudentSearch} from "@/modules/admin-ui/super-admin-placement-student-search-model";
import {ErrorState} from "@/components/ui/error-state";
export default async function SuperAdminPlacementStudentLookup({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const ctx=await getCurrentRequestContext();
 const params=await searchParams;
 const {query,invalid}=parseSuperAdminPlacementStudentSearch(params);
 // Invalid lengths/duplicate query keys are recoverable and NEVER passed to
 // strict service validation, which would otherwise throw from a hostile URL.
 const q=query??"";
 const lookup=query&&ctx.adminScope?.collegeId?
  await lookupCollegeStudentPlacement(ctx,query)
    .then(value=>({ok:true as const,value}))
    .catch(()=>({ok:false as const})):null;
 const data=lookup&&lookup.ok?lookup.value:null;
 // Selection stays inside the authorized college search result. A forged ID
 // never becomes a free-form membership lookup or reveals another tenant.
 const choices=data?.students.slice(0,10)??[];
 const requestedStudent=typeof params.student==="string"&&
   /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.student)
   ?params.student:null;
 const selectedStudent=choices.find(person=>person.membershipId===requestedStudent)??null;
 return <div className="min-w-0 space-y-6">
  <div className="min-w-0">
   <PageBackLink href="/admin/placements" label="Placement overview" />
   <PageHeader title="Student placement lookup" />
  </div>
  <form action="/admin/placements/student-lookup" role="search" className="grid min-w-0 gap-[8px] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
   <label className="grid w-full min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name, roll number or email
    <Input type="search" name="q" minLength={3} maxLength={150} required disabled={!ctx.adminScope?.collegeId} aria-describedby={!ctx.adminScope?.collegeId?"placement-student-scope-hint":undefined} defaultValue={q}
      placeholder="Find one student in this college"
      className="min-h-11 w-full min-w-0 md:min-h-9"/>
   </label>
   <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={!ctx.adminScope?.collegeId}>Search students</Button>
  </form>
  <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
   <Link href="/admin/placements/analytics" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-[650] text-primary-text md:min-h-9 hover:border-[var(--lms-button-primary)] hover:bg-[var(--lms-button-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Analytics</Link>
  </div>
  {invalid?<ErrorState title="Invalid student search"
   description="Enter 3 to 150 characters in a single search to find students in the selected college."
   action={<Link href="/admin/placements/student-lookup" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] underline-offset-4 w-full md:w-auto">Clear search</Link>}/>:null}
  {lookup&&!lookup.ok?<ErrorState title="Student placement lookup unavailable"
   description="Search failed — try again. Your selected college and search have been kept."
   action={<Link href={"/admin/placements/student-lookup?q="+encodeURIComponent(q)}
     className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] underline-offset-4 w-full md:w-auto">Retry student search</Link>}/>:null}
  {!ctx.adminScope?.collegeId?<div id="placement-student-scope-hint" role="status">
   <EmptyState title="Select a college to continue" description="Choose a college in the header above to look up student placements."/>
  </div>:null}
  {data&&!data.students.length?<EmptyState title="No matching students" description="No students in the selected college match this name, roll number or email."
   action={<Link href="/admin/placements/student-lookup" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] underline-offset-4 w-full md:w-auto">Clear search</Link>} />:null}
  {data&&data.students.length>0?<div className="min-w-0 space-y-3 border-b border-border pb-4">
    <p className="text-sm text-muted-foreground">Select one student to view placement history. Showing the first {choices.length} matches; narrow your search for more specific results.</p>
    <div role="list" aria-label="Matching students" className="divide-y divide-border border-y border-border">
      {choices.map(person=><div role="listitem" key={person.membershipId}>
        <Link href={"/admin/placements/student-lookup?"+new URLSearchParams({q,student:person.membershipId}).toString()}
          aria-current={selectedStudent?.membershipId===person.membershipId?"page":undefined}
          className="flex min-h-11 min-w-0 flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm text-primary-text hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)]">
          <span className="min-w-0 break-words font-semibold">{person.name??person.roll??"Student"}</span>
          <span className="text-xs text-muted-foreground">{person.roll??"No roll number"}</span>
        </Link>
      </div>)}
    </div>
    {requestedStudent&&!selectedStudent?<p role="alert" className="text-sm text-error">The selected student is not in these college search results. Choose a student from this list.</p>:null}
  </div>:null}
  {selectedStudent?<section className="min-w-0 space-y-[var(--lms-space-3)] border-b border-border py-[var(--lms-space-4)] last:border-0">
   <div className="grid min-w-0 gap-[var(--lms-space-2)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-[var(--lms-space-4)]">
    <div className="min-w-0"><h2 className="m-0 break-words font-semibold text-[var(--lms-heading)]">{selectedStudent.name??selectedStudent.roll??"Student"}</h2>
     <p className="mt-1 break-words text-xs text-muted-foreground">{selectedStudent.roll??"No roll number"} · {selectedStudent.email??"No email"}</p></div>
    <div className="flex min-w-0 items-center sm:justify-end"><StatusBadge tone={selectedStudent.placed?"success":"neutral"}>{selectedStudent.placed?"Joined (confirmed)":"No confirmed joining recorded"}</StatusBadge></div>
   </div>
   <DataTable
    caption="Student applications"
    rows={selectedStudent.applications.map((row,index)=>({...row,uxKey:row.jobId+":"+index}))}
    getRowKey={row=>row.uxKey}
    columns={[
      {key:"job",header:"Company / drive",mobilePriority:"primary",cell:row=>row.company+" · "+row.job},
      {key:"application",header:"Application",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.applicationStatus==="SUBMITTED"?"info":row.applicationStatus==="WITHDRAWN"?"neutral":row.applicationStatus==="REJECTED"?"error":"warning"}>{row.applicationStatus}</StatusBadge>},
      {key:"offer",header:"Offer",mobilePriority:"secondary",cell:row=>row.offerStatus?<StatusBadge tone={row.offerStatus==="ACCEPTED"?"success":row.offerStatus==="DECLINED"?"error":"info"}>{row.offerStatus}</StatusBadge>:"None"},
      {key:"joining",header:"Joining",mobilePriority:"secondary",cell:row=>row.joining??"Not recorded"},
    ]}
    empty={<EmptyState title="No applications found" description="No placement applications are recorded for this student."/>}
   />
   {selectedStudent.truncated?<p className="text-xs text-muted-foreground">Showing newest 100 application/offer records.</p>:null}
  </section>:null}
 </div>;
}
