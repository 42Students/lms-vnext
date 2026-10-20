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
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin · Placements" title="Student placement lookup"
   actions={<>
    <PageBackLink href="/admin/placements" label="Placement overview" />
    <Link href="/admin/placements/analytics" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Analytics</Link>
   </>}/>
  <form action="/admin/placements/student-lookup" role="search" className="flex min-w-0 flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-end">
   <label className="grid w-full min-w-0 flex-1 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] md:max-w-xl">Name, roll number or email
    <Input type="search" name="q" minLength={3} maxLength={150} required disabled={!ctx.adminScope?.collegeId} aria-describedby={!ctx.adminScope?.collegeId?"placement-student-scope-hint":undefined} defaultValue={q}
      placeholder="Find one student in this college"
      className="min-h-11 w-full min-w-0 md:min-h-9"/>
   </label>
   <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={!ctx.adminScope?.collegeId}>Search students</Button>
  </form>
  {invalid?<ErrorState title="Invalid student search"
   description="Enter 3 to 150 characters in a single search to find students in the selected college."
   action={<Link href="/admin/placements/student-lookup" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Clear search</Link>}/>:null}
  {lookup&&!lookup.ok?<ErrorState title="Student placement lookup unavailable"
   description="The selected college's student placement records could not be loaded. Your search was kept."
   action={<Link href={"/admin/placements/student-lookup?q="+encodeURIComponent(q)}
     className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry student search</Link>}/>:null}
  {!ctx.adminScope?.collegeId?<div id="placement-student-scope-hint" role="status">
   <EmptyState title="Select a college to continue" description="Choose a college in the header above to look up student placements."/>
  </div>:null}
  {data&&!data.students.length?<EmptyState title="No matching college students." description="Name, roll number or email" />:null}
  {data?.students.map(person=><section key={person.membershipId} className="min-w-0 space-y-3 border-b border-border py-5 last:border-0">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <div><h2 className="font-semibold text-[var(--lms-heading)]">{person.name??person.roll??"Student"}</h2>
     <p className="text-xs text-muted-foreground">{person.roll??"No roll number"} · {person.email??"No email"}</p></div>
    <StatusBadge tone={person.placed?"success":"neutral"}>{person.placed?"Joined (confirmed)":"No confirmed joining recorded"}</StatusBadge>
   </div>
   <DataTable
    caption="Student applications"
    rows={person.applications.map((row,index)=>({...row,uxKey:row.jobId+":"+index}))}
    getRowKey={row=>row.uxKey}
    columns={[
      {key:"job",header:"Company / drive",mobilePriority:"primary",cell:row=>row.company+" · "+row.job},
      {key:"application",header:"Application",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.applicationStatus==="SUBMITTED"?"info":row.applicationStatus==="WITHDRAWN"?"neutral":"warning"}>{row.applicationStatus}</StatusBadge>},
      {key:"offer",header:"Offer",mobilePriority:"secondary",cell:row=>row.offerStatus?<StatusBadge tone={row.offerStatus==="ACCEPTED"?"success":row.offerStatus==="DECLINED"?"neutral":"info"}>{row.offerStatus}</StatusBadge>:"None"},
      {key:"joining",header:"Joining",mobilePriority:"secondary",cell:row=>row.joining??"Not recorded"},
    ]}
    empty={<EmptyState title="No applications found" description="No applications found."/>}
   />
   {person.truncated?<p className="text-xs text-muted-foreground">Showing newest 100 application/offer records.</p>:null}
  </section>)}
  {data?.truncated?<p className="text-xs text-muted-foreground">Showing first 15 matching students; narrow the search.</p>:null}
 </div>;
}
