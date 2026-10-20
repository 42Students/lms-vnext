import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {DataTable, type DataTableColumn} from "@/components/ui/data-table";
import {lookupCollegeStudentPlacement} from "@/modules/placements/college-placement-student-lookup-service";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {EmptyState} from "@/components/ui/empty-state";
import {StatusBadge} from "@/components/ui/status-badge";
type StudentApplication = NonNullable<Awaited<ReturnType<typeof lookupCollegeStudentPlacement>>>["students"][number]["applications"][number];
const columns:DataTableColumn<StudentApplication & {uiKey:string}>[]=[
  {key:"drive",header:"Company / drive",mobilePriority:"primary",cell:row=>row.company+" · "+row.job},
  {key:"application",header:"Application",cell:row=>row.applicationStatus},
  {key:"offer",header:"Offer",cell:row=>row.offerStatus??"None"},
  {key:"joining",header:"Joining",cell:row=>row.joining??"Not recorded"},
];
export default async function CollegePlacementStudentLookup({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const params=await searchParams,q=typeof params.q==="string"?params.q.trim():"";
 const data=q.length>=3?await lookupCollegeStudentPlacement(await getCurrentRequestContext(),q):null;
 return <div className="space-y-5">
  <PageHeader title="Student placement lookup"
   actions={<Link href="/college/hiring-dashboard" className="font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-h-11 md:min-h-9 inline-flex items-center">Analytics</Link>}/>
  <form action="/college/placements/student-lookup" role="search" className="border-b border-border pb-5">
   <label className="grid max-w-xl gap-2 text-sm font-semibold">Name, roll number or email
    <Input type="search" name="q" minLength={3} maxLength={150} required defaultValue={q}
      placeholder="Find one student in this college"
      />
   </label>
   <Button className="mt-3 min-h-11 md:min-h-9">Search students</Button>
  </form>
  {data&&!data.students.length?<EmptyState title="No matching students" description="No matching college students."/>:null}
  {data?.students.map(person=><section key={person.membershipId} className="space-y-3 border-t border-border pt-5">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <div><h2 className="font-semibold">{person.name??person.roll??"Student"}</h2>
     <p className="text-xs text-muted-foreground">{person.roll??"No roll number"} · {person.email??"No email"}</p></div>
    <StatusBadge tone={person.placed?"success":"neutral"}>{person.placed?"Joined (confirmed)":"No confirmed joining recorded"}</StatusBadge>
   </div>
   <DataTable caption="Student placement applications" columns={columns}
    rows={person.applications.map((row,i)=>({...row,uiKey:row.jobId+":"+i}))}
    getRowKey={row=>row.uiKey}
    empty={<EmptyState title="No applications" description="No applications found."/>}/>
   {person.truncated?<p className="text-xs text-muted-foreground">Showing newest 100 application/offer records.</p>:null}
  </section>)}
  {data?.truncated?<p className="text-xs text-muted-foreground">Showing first 15 matching students; narrow the search.</p>:null}
 </div>;
}
