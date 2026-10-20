import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {Banner} from "@/components/ui/banner";
import {SummaryStrip} from "@/components/ui/summary-strip";
import {StatusBadge} from "@/components/ui/status-badge";
import {DataTable, type DataTableColumn} from "@/components/ui/data-table";
import {hasMembershipRole} from "@/modules/identity/context";
import {collegeInterviewFilters,listCollegeInterviewDirectory} from "@/modules/placements/college-interview-directory-service";
import {CollegeInterviewStatusActions} from "@/components/placements/college-interview-status-actions";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
import {StatTile} from "@/components/ui/stat-tile";
export const dynamic="force-dynamic";
type Params=Record<string,string|string[]|undefined>;
const first=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v;
export default async function CollegeInterviewsPage({searchParams}:{searchParams:Promise<Params>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"COLLEGE_ADMIN"))redirect("/dashboard");
 const raw=await searchParams;
 const input={q:first(raw.q)??"",status:first(raw.status)??"ALL",
  mode:first(raw.mode)??"ALL",type:first(raw.type)??"ALL",
  companyId:first(raw.companyId)||undefined,departmentId:first(raw.departmentId)||undefined,
  sort:first(raw.sort)??"UPCOMING",page:first(raw.page)??"1"};
 const valid=collegeInterviewFilters.safeParse(input);
 if(!valid.success)return <div className="space-y-4"><PageHeader title="Interviews"/><ErrorState title="Invalid interview filters" description="Review the interview search and filters." action={<Link href="/college/placements/interviews" className="inline-flex min-h-11 items-center text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Clear filters</Link>}/></div>;
 const data=await listCollegeInterviewDirectory(context,valid.data);
 const build=(page:number,format:"html"|"ics"|"csv"="html")=>{
  const query=new URLSearchParams({q:valid.data.q,status:valid.data.status,
   mode:valid.data.mode,type:valid.data.type,sort:valid.data.sort,page:String(page),
   ...(valid.data.companyId?{companyId:valid.data.companyId}:{}),
   ...(valid.data.departmentId?{departmentId:valid.data.departmentId}:{}),
  });
  const route=format==="ics"?"/api/college/placements/interviews/calendar":
   format==="csv"?"/api/college/placements/interviews/export":"/college/placements/interviews";
  return route+"?"+query;
 };
 const formatter=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"});
 const columns:DataTableColumn<(typeof data.rows)[number]>[]=[
  {key:"student",header:"Student",mobilePriority:"primary",cell:row=><strong>{row.student}</strong>},
  {key:"drive",header:"Company / drive",cell:row=><span>{row.company}<span className="block text-xs text-muted-foreground">{row.job}</span></span>},
  {key:"department",header:"Department",cell:row=>row.department??"—"},
  {key:"type",header:"Type",cell:row=>row.kind},
  {key:"start",header:"Scheduled time",cell:row=>formatter.format(row.start)+" IST"},
  {key:"venue",header:"Mode / venue",cell:row=><span>{row.mode}<span className="block">{row.venue??"—"}</span></span>},
  {key:"status",header:"Status",cell:row=><span><StatusBadge tone={row.status==="COMPLETED"?"success":row.status==="SCHEDULED"?"info":"neutral"}>{row.status}</StatusBadge>{row.conflict?<span className="block text-body">Conflict: this student has overlapping interviews.</span>:null}</span>},
  {key:"actions",header:"Actions",mobilePriority:"action",cell:row=><div className="flex flex-wrap items-center gap-2">
    <Link href={"/college/placements/jobs/"+encodeURIComponent(row.jobId)+"/applications"}
      className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">View applications</Link>
    <CollegeInterviewStatusActions id={row.id} version={row.version} status={row.status}/>
  </div>},
 ];
 return <div className="space-y-5">
  <PageHeader title="Interviews"
   description="Interview appointments across drives in the selected college." actions={data.ready?<><a href={build(1,"ics")} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text md:min-h-9 md:w-auto">Download .ics</a><a href={build(1,"csv")} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text md:min-h-9 md:w-auto">Export CSV</a></>:undefined}/>
  {!data.ready?<Banner tone="warning">
    Candidate interview appointment storage is not registered. No schedule or conflict counts are inferred from round-level placeholders.
   </Banner>:<>
   <SummaryStrip label="Interview summary" steps={[{label:"Scheduled",value:data.summary?.scheduled??0},{label:"Today",value:data.summary?.today??0},{label:"Companies",value:data.summary?.companies??0},{label:"Conflicts",value:data.summary?.conflicts??0}]}/>
   <form method="get" className="grid min-w-0 gap-3 border-b border-border pb-4 md:grid-cols-3">
    <label className="grid gap-1 text-sm">Search student, company or role
     <Input name="q" defaultValue={valid.data.q} maxLength={100} />
    </label>
    <label className="grid gap-1 text-sm">Company
     <Select name="companyId" defaultValue={valid.data.companyId??""} >
      <option value="">All companies</option>{data.companies.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
     </Select>
    </label>
    <label className="grid gap-1 text-sm">Department
     <Select name="departmentId" defaultValue={valid.data.departmentId??""} >
      <option value="">All departments</option>{data.departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
     </Select>
    </label>
    {([{name:"type",label:"Type",values:["ALL","INTERVIEW","GD"]},
      {name:"status",label:"Status",values:["ALL","SCHEDULED","COMPLETED","NO_SHOW","CANCELLED"]},
      {name:"mode",label:"Mode",values:["ALL","ON_CAMPUS","VIRTUAL"]}]
    ).map(filter=><label key={filter.name} className="grid gap-1 text-sm">{filter.label}
     <Select name={filter.name} defaultValue={String(valid.data[filter.name as "type"|"status"|"mode"])}
      >
      {filter.values.map(value=><option key={value} value={value}>{value==="ALL"?"All":value.replaceAll("_"," ")}</option>)}
     </Select></label>)}
    <label className="grid gap-1 text-sm">Sort
     <Select name="sort" defaultValue={valid.data.sort} >
      <option value="UPCOMING">Upcoming first</option><option value="RECENT">Recent first</option>
      <option value="STUDENT">Student name</option>
     </Select>
    </label>
    <div className="flex min-w-0 flex-wrap items-end gap-3"><Button variant="primary" type="submit" className="inline-flex min-h-11 w-full items-center justify-center md:min-h-9 md:w-auto">Apply filters</Button>
     <Link href="/college/placements/interviews" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Clear</Link>
    </div>
   </form>
   <div className="flex flex-wrap items-center gap-3">
    <p role="status" className="text-sm">{data.total} matching appointments</p>
    
   </div>
   {data.limited?<p role="status" className="text-sm text-warning-text">Results and summary are capped at the first 5,000 records. Narrow filters for a complete view.</p>:null}
   <section aria-label="College interview appointments">
    <DataTable caption="College interview appointments" columns={columns}
      rows={data.rows} getRowKey={row=>row.id}
      empty={<EmptyState title="No matching interviews" description="No interviews match these filters."/>} />
   </section>
   <nav aria-label="Interview result pages" className="flex gap-4 text-sm">
    {valid.data.page>1?<Link href={build(valid.data.page-1)} className="text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-h-11 md:min-h-9 inline-flex items-center">Previous</Link>:null}
    <span>Page {valid.data.page} of {data.pageCount}</span>
    {valid.data.page<data.pageCount?<Link href={build(valid.data.page+1)} className="text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-h-11 md:min-h-9 inline-flex items-center">Next</Link>:null}
   </nav>
  </>}
 </div>;
}
