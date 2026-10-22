import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {DataTable, type DataTableColumn} from "@/components/ui/data-table";
import {lookupCollegeStudentPlacement} from "@/modules/placements/college-placement-student-lookup-service";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {EmptyState} from "@/components/ui/empty-state";
import {StatusBadge} from "@/components/ui/status-badge";
import {Disclosure} from "@/components/ui/disclosure";
type StudentApplication = NonNullable<Awaited<ReturnType<typeof lookupCollegeStudentPlacement>>>["students"][number]["applications"][number];
const columns:DataTableColumn<StudentApplication & {uiKey:string}>[]=[
  {key:"drive",header:"Company / drive",mobilePriority:"primary",cell:row=><span className="break-words [overflow-wrap:anywhere]">{row.company+" · "+row.job}</span>},
  {key:"application",header:"Application",cell:row=><StatusBadge tone={row.applicationStatus==="SUBMITTED"?"info":"neutral"}>{row.applicationStatus}</StatusBadge>},
  {key:"offer",header:"Offer",cell:row=>row.offerStatus?<StatusBadge tone="info">{row.offerStatus}</StatusBadge>:"None"},
  {key:"joining",header:"Joining",cell:row=>row.joining??"Not recorded"},
];
export default async function CollegePlacementStudentLookup({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const params=await searchParams,q=typeof params["q"]==="string"?params["q"].trim():"";
 const data=q.length>=3?await lookupCollegeStudentPlacement(await getCurrentRequestContext(),q):null;
 return <div className="min-w-0 max-w-full space-y-4">
  <PageHeader title="Student placement lookup"
   actions={<Link href="/college/hiring-dashboard" className="font-semibold text-link underline min-h-11 md:min-h-9 inline-flex items-center hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto justify-center">Analytics</Link>}/>
  <form action="/college/placements/student-lookup" role="search" aria-label="Student placement search" className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] sm:grid-cols-[minmax(0,2fr)_auto_auto]">
   <label className="grid min-w-0 w-full max-w-xl gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Name, roll number or email
    <Input type="search" name="q" minLength={3} maxLength={150} required defaultValue={q}
      placeholder="Find one student in this college"
      />
   </label>
   <Button className="min-h-11 w-full sm:w-auto md:min-h-9">Search students</Button>
   {q ? <Link href="/college/placements/student-lookup" className="inline-flex min-h-11 items-center justify-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear</Link> : null}
  </form>
  {!data ? <p role="status" className="max-w-[70ch] text-sm leading-[22px] text-body">{q.length>0?"Enter at least three characters to search student placements.":"Search by name, roll number or email to review a student’s recorded applications, offers and joining outcomes."}</p> : null}
  {data&&!data.students.length?<EmptyState title="No matching students" description="No matching college students."/>:null}
  {data?.students.map((person,index)=><section key={person.membershipId} className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)]">
   <Disclosure defaultOpen={index===0} title={<span className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]"><strong className="break-words [overflow-wrap:anywhere]">{person.name??person.roll??"Student"}</strong><StatusBadge tone={person.placed?"success":"neutral"}>{person.placed?"Joined (confirmed)":"No confirmed joining recorded"}</StatusBadge></span>}>
    <p className="min-w-0 break-words [overflow-wrap:anywhere] pb-[var(--lms-space-3)] text-xs text-muted-foreground leading-5">{person.roll??"No roll number"} · {person.email??"No email"}</p>
   <DataTable caption={`${person.name??person.roll??"Student"} placement applications`} columns={columns}
    rows={person.applications.map((row,i)=>({...row,uiKey:row.jobId+":"+i}))}
    getRowKey={row=>row.uiKey}
    empty={<EmptyState title="No applications" description="No applications found."/>}/>
   {person.truncated?<p className="max-w-[70ch] py-[var(--lms-space-2)] text-xs text-muted-foreground leading-5">Showing newest 100 application/offer records.</p>:null}
   </Disclosure>
  </section>)}
  {data?.truncated?<p role="status" className="max-w-[70ch] text-xs leading-5 text-muted-foreground">Showing first 15 matching students; narrow the search.</p>:null}
 </div>;
}
