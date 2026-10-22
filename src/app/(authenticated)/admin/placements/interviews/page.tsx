import Link from "next/link";
import {and,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
  collegeMemberships,departments,learnerProgramEnrollments,placementApplications,
  placementRoundCandidateSlots,programs,
} from "@/db/schema";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listSuperAdminInterviews} from "@/modules/admin-ui/super-admin-placement-interviews-service";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {Alert} from "@/components/ui/alert";
import {StatusBadge} from "@/components/ui/status-badge";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";

export const dynamic="force-dynamic";

/** Legacy Interviews was an appointment roster, not a round catalogue.
 * Calendar remains the authoritative booking/edit surface; the roster renders
 * the candidate's persisted academic department under the same college scope.
 */
export default async function SuperAdminInterviewsPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 const raw=await searchParams;
 const currentPage=typeof raw["page"]==="string"&&/^[1-9][0-9]{0,4}$/.test(raw["page"])
  ?Number(raw["page"]):1;
 const requestedJob=typeof raw["jobId"]==="string"&&
  /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(raw["jobId"])
  ?raw["jobId"]:undefined;
 const calendarQuery=new URLSearchParams({view:"agenda"});
 for(const key of ["date","company","roundKind","job","jobId"] as const){
  const value=raw[key];
  if(typeof value==="string"&&value.length<=100)calendarQuery.set(key,value);
 }
 const calendarHref="/admin/placements/calendar?"+calendarQuery.toString();
 const returnLink=<Link href={calendarHref}
  className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
  Open interview calendar →
 </Link>;
 if(!context.adminScope?.collegeId)return <div className="min-w-0 space-y-4">
  <PageHeader title="Interviews" actions={returnLink}/>
  <ErrorState title="Select a college" description="Candidate appointments and academic departments require an exact college scope."/>
 </div>;
 let report:Awaited<ReturnType<typeof listSuperAdminInterviews>>;
 try{
  report=await listSuperAdminInterviews(context,{
   page:currentPage,pageSize:50,status:"ALL",
   ...(requestedJob?{jobId:requestedJob}:{}),
  });
 }catch{
  return <div className="min-w-0 space-y-4">
   <PageHeader title="Interviews" actions={returnLink}/>
   <ErrorState title="Could not load appointments" description="Select an authorized college and retry its candidate appointment roster."
     action={<Link href="/admin/placements/interviews" className="font-semibold text-primary-text underline">Retry appointments</Link>}/>
  </div>;
 }
 const items=report.items;
 const appointmentIds=items.map(item=>item.id);
 // One learner may have several historical enrollments. Pick their current
 // academic department first, or their latest historic mapping otherwise.
 // Never resolve by student display name or from another college's programs.
 const departmentsRead=await (appointmentIds.length
  ?getDb().select({
   slotId:placementRoundCandidateSlots.id,
   departmentName:departments.name,
   enrollmentStatus:learnerProgramEnrollments.status,
   enrolledAt:learnerProgramEnrollments.admittedAt,
  }).from(placementRoundCandidateSlots)
   .innerJoin(placementApplications,and(
    eq(placementApplications.id,placementRoundCandidateSlots.applicationId),
    eq(placementApplications.jobId,placementRoundCandidateSlots.jobId)))
   .innerJoin(collegeMemberships,and(
    eq(collegeMemberships.id,placementApplications.membershipId),
    eq(collegeMemberships.collegeId,context.adminScope.collegeId)))
   .innerJoin(learnerProgramEnrollments,
    eq(learnerProgramEnrollments.membershipId,collegeMemberships.id))
   .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
   .innerJoin(departments,and(
    eq(departments.id,programs.departmentId),
    eq(departments.collegeId,context.adminScope.collegeId)))
   .where(inArray(placementRoundCandidateSlots.id,appointmentIds))
   .orderBy(sql`case when ${learnerProgramEnrollments.status}='ACTIVE' then 0 else 1 end`,
     sql`${learnerProgramEnrollments.admittedAt} desc`)
   .limit(500)
  :Promise.resolve([])).then(rows=>({ok:true as const,rows}),()=>({ok:false as const,rows:[]}));
 const departmentBySlot=new Map<string,string>();
 for(const row of departmentsRead.rows){
  if(!departmentBySlot.has(row.slotId))departmentBySlot.set(row.slotId,row.departmentName);
 }
 const detail=(item:(typeof items)[number],key:string)=>
  item.details.find(entry=>entry.startsWith(key+": "))?.slice(key.length+2)??"—";
 const pageHref=(page:number)=>{
  const params=new URLSearchParams({page:String(page)});
  if(requestedJob)params.set("jobId",requestedJob);
  return "/admin/placements/interviews?"+params.toString();
 };
 const columns:DataTableColumn<(typeof items)[number]>[]=[
  {key:"job",header:"Job",mobilePriority:"primary",cell:item=><div className="min-w-0">
    <Link href={"/admin/placements/jobs/"+encodeURIComponent(item.jobId)+"/applications?collegeId="+encodeURIComponent(context.adminScope!.collegeId!)}
      className="block font-semibold text-link underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2">
      {item.title}</Link>
    <span className="block text-xs text-muted-foreground">{item.subtitle.split(" · ").slice(1).join(" · ")}</span>
   </div>},
  {key:"candidate",header:"Candidate",cell:item=><div className="min-w-0">
    <span className="block">{detail(item,"Candidate")}</span>
    <span className="block text-xs text-muted-foreground">{departmentBySlot.get(item.id)??"Department not recorded"}</span>
   </div>},
  {key:"type",header:"Type",cell:item=>detail(item,"Type")},
  {key:"status",header:"Status",cell:item=><StatusBadge
    tone={item.status==="SCHEDULED"?"info":
      item.status==="CONFIRMED"?"success":
      item.status==="RESCHEDULE_REQUESTED"?"warning":
      item.status==="CANCELLED"||item.status==="NO_SHOW"?"error":"neutral"}>
    {item.status==="RESCHEDULE_REQUESTED"?"Reschedule":
      item.status==="NO_SHOW"?"No Show":item.status.replaceAll("_"," ")}</StatusBadge>},
  {key:"date",header:"Date & Time",cell:item=><span className="whitespace-nowrap">{detail(item,"Date & Time")}</span>},
  {key:"interviewer",header:"Interviewer",cell:item=>detail(item,"Interviewer")},
  {key:"mode",header:"Mode",cell:item=>detail(item,"Mode").replaceAll("_"," ")},
  {key:"actions",header:"Actions",mobilePriority:"action",cell:item=><Link href={item.href??calendarHref}
    className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 md:min-h-9">Open appointment</Link>},
 ];
 return <div className="min-w-0 space-y-5">
  <PageHeader title="Interviews"
   description="Candidate appointments for the selected college, with each learner's academic department."
   actions={returnLink}/>
  {!departmentsRead.ok?<Alert tone="warning" role="status">
   Candidate appointments were loaded but their department mapping is unavailable.
   Retry to restore academic departments; no other college's details are shown.
  </Alert>:null}
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
   <p className="text-sm text-body">{report.total} appointments · page {report.query.page} of {report.totalPages}</p>
   <Link href={calendarHref} className="text-sm font-semibold text-primary-text underline">Manage bookings and schedules →</Link>
  </div>
  <DataTable caption="Candidate interview appointments" rows={items} columns={columns}
   getRowKey={item=>item.id} mobileMode="scroll" empty={<p role="status"
    className="py-5 text-sm text-body">
    No candidate appointments in this scope or selected job. Open the interview calendar to schedule a new booking.
   </p>}/>
  <nav aria-label="Interview appointment pages" className="flex flex-wrap justify-between gap-3">
   {report.query.page>1?<Link href={pageHref(report.query.page-1)}
     className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">← Previous</Link>:<span/>}
   {report.query.page<report.totalPages?<Link href={pageHref(report.query.page+1)}
     className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Next →</Link>:null}
  </nav>
 </div>;
}
