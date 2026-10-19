import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
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
 const data=query&&ctx.adminScope?.collegeId?await lookupCollegeStudentPlacement(ctx,query):null;
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin · Placements" title="Student placement lookup"
   actions={<Link href="/admin/placements/analytics" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">Analytics</Link>}/>
  <form action="/admin/placements/student-lookup" role="search" className="min-w-0 border-b border-border pb-4">
   <label className="grid max-w-xl gap-2 text-sm font-semibold">Name, roll number or email
    <Input type="search" name="q" minLength={3} maxLength={150} required disabled={!ctx.adminScope?.collegeId} aria-describedby={!ctx.adminScope?.collegeId?"placement-student-scope-hint":undefined} defaultValue={q}
      placeholder="Find one student in this college"
      className="w-full"/>
   </label>
   <Button type="submit" className="mt-3" disabled={!ctx.adminScope?.collegeId}>Search students</Button>
  </form>
  {invalid?<ErrorState title="Invalid student search"
   description="Enter 3 to 150 characters in a single search to find students in the selected college."
   action={<Link href="/admin/placements/student-lookup" className="font-semibold text-primary-text">Clear search</Link>}/>:null}
  {!ctx.adminScope?.collegeId?<p id="placement-student-scope-hint" role="status" className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 sm:p-6">Select a college to continue. Choose a college in the header above to look up student placements.</p>:null}
  {data&&!data.students.length?<EmptyState title="No matching college students." description="Name, roll number or email" />:null}
  {data?.students.map(person=><section key={person.membershipId} className="min-w-0 space-y-3 border-b border-border py-5 last:border-0">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <div><h2 className="font-semibold">{person.name??person.roll??"Student"}</h2>
     <p className="text-xs text-muted-foreground">{person.roll??"No roll number"} · {person.email??"No email"}</p></div>
    <StatusBadge tone={person.placed?"success":"neutral"}>{person.placed?"Joined (confirmed)":"No confirmed joining recorded"}</StatusBadge>
   </div>
   <DataTable
    caption="Student applications"
    rows={person.applications.map((row,index)=>({...row,uxKey:row.jobId+":"+index}))}
    getRowKey={row=>row.uxKey}
    columns={[
      {key:"job",header:"Company / drive",mobilePriority:"primary",cell:row=>row.company+" · "+row.job},
      {key:"application",header:"Application",mobilePriority:"secondary",cell:row=>row.applicationStatus},
      {key:"offer",header:"Offer",mobilePriority:"secondary",cell:row=>row.offerStatus??"None"},
      {key:"joining",header:"Joining",mobilePriority:"secondary",cell:row=>row.joining??"Not recorded"},
    ]}
    empty={<p className="text-sm text-body">No applications found.</p>}
   />
   {person.truncated?<p className="text-xs text-muted-foreground">Showing newest 100 application/offer records.</p>:null}
  </section>)}
  {data?.truncated?<p className="text-xs text-muted-foreground">Showing first 15 matching students; narrow the search.</p>:null}
 </div>;
}
