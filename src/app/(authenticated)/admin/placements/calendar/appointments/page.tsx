import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { listSuperAdminCalendarAppointments } from "@/modules/placements/super-admin-calendar-appointment-directory";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TYPES=["ALL","SCREENING","TECHNICAL","HR","MANAGERIAL","FINAL"] as const;
const STATUSES=["ALL","ACTIVE","SCHEDULED","CONFIRMED","RESCHEDULE_REQUESTED",
 "COMPLETED","CANCELLED","NO_SHOW"] as const;
const MODES=["ALL","ONLINE","IN_PERSON"] as const;
function validOption<T extends string>(value:string|undefined,options:readonly T[],fallback:T):T{
 return options.find(option=>option===value)??fallback;
}
function ist(value:string){
 return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",
  dateStyle:"medium",timeStyle:"short"}).format(new Date(value))+" IST";
}
const activeStatuses=new Set(["SCHEDULED","CONFIRMED","RESCHEDULE_REQUESTED"]);

export default async function SuperAdminCalendarAppointmentsPage({
 searchParams,
}: { searchParams:Promise<Record<string,string|string[]|undefined>> }){
 const context=await getCurrentRequestContext();
 if(!context.adminScope?.collegeId)return <div className="min-w-0 space-y-4">
  <PageHeader title="Interview appointments"/>
  <EmptyState title="Select an Organization + College in the header above to view interviews."
   description="A college safety scope is required before viewing learner appointments."/>
 </div>;
 const query=await searchParams;
 if(Object.values(query).some(Array.isArray))return <div className="min-w-0 space-y-4">
  <PageHeader title="Interview appointments"/>
  <Alert tone="error">Invalid appointment filters. <Link href="/admin/placements/calendar/appointments" className="font-semibold text-link underline">Reset</Link></Alert>
 </div>;
 const scalar=(value:string|string[]|undefined)=>typeof value==="string"?value:undefined;
 const type=validOption(scalar(query.type),TYPES,"ALL");
 const status=validOption(scalar(query.status),STATUSES,"ALL");
 const mode=validOption(scalar(query.mode),MODES,"ALL");
 const search=(scalar(query.q)??"").trim().toLocaleLowerCase("en-IN").slice(0,100);
 const rawPage=scalar(query.page)??"1";
 const page=/^[1-9][0-9]{0,4}$/.test(rawPage)?Number(rawPage):1;
 const result=await listSuperAdminCalendarAppointments(context);
 const filtered=result.items.filter(item=>
  (type==="ALL"||item.type===type)&&
  (status==="ALL"||status==="ACTIVE"&&activeStatuses.has(item.status)||item.status===status)&&
  (mode==="ALL"||item.mode===mode)&&
  (!search||[item.candidateName,item.companyName,item.jobTitle,item.roundName]
   .some(value=>value?.toLocaleLowerCase("en-IN").includes(search))));
 const size=20,pages=Math.max(1,Math.ceil(filtered.length/size));
 const selectedPage=Math.min(page,pages);
 const pageItems=filtered.slice((selectedPage-1)*size,selectedPage*size);
 const href=(value:number)=>{
  const args=new URLSearchParams();
  for(const [key,setting] of [["type",type],["status",status],["mode",mode]] as const){
   if(setting!=="ALL")args.set(key,setting);
  }
  if(search)args.set("q",search);
  args.set("page",String(value));
  return "/admin/placements/calendar/appointments?"+args.toString();
 };
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Interview appointments"
   description="Candidate interviews across the selected college, independent of the calendar's visible month."
   actions={<Link href="/admin/placements/calendar"
    className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
    Calendar view</Link>}/>
  <form method="get" className="grid min-w-0 gap-3 border-b border-border pb-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_auto] xl:items-end">
   <label className="grid gap-2 text-[13px] font-semibold text-body">Search
    <Input type="search" name="q" maxLength={100} defaultValue={search}
     placeholder="Job, company or candidate" className="min-h-11 md:min-h-9"/></label>
   <label className="grid gap-2 text-[13px] font-semibold text-body">Type
    <Select name="type" defaultValue={type} className="min-h-11 md:min-h-9">
     {TYPES.map(item=><option key={item} value={item}>{item==="ALL"?"All types":item}</option>)}
    </Select></label>
   <label className="grid gap-2 text-[13px] font-semibold text-body">Status
    <Select name="status" defaultValue={status} className="min-h-11 md:min-h-9">
     {STATUSES.map(item=><option key={item} value={item}>{item==="ALL"?"All statuses":item==="RESCHEDULE_REQUESTED"?"Reschedule requested":item==="NO_SHOW"?"No show":item}</option>)}
    </Select></label>
   <label className="grid gap-2 text-[13px] font-semibold text-body">Mode
    <Select name="mode" defaultValue={mode} className="min-h-11 md:min-h-9">
     {MODES.map(item=><option key={item} value={item}>{item==="ALL"?"All modes":item==="ONLINE"?"Online":"In-person"}</option>)}
    </Select></label>
   <Button type="submit" className="min-h-11 w-full md:min-h-9">Filter</Button>
   <Link href="/admin/placements/calendar/appointments"
    className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Reset</Link>
  </form>
  {result.truncated?<Alert tone="warning">Showing up to 2,000 appointments. Conflict indicators may be incomplete outside this bounded sample. Narrow the college's interview search for current appointments.</Alert>:null}
  <p role="status" className="text-sm text-body">
   {filtered.length.toLocaleString("en-IN")} matching appointments · Page {selectedPage} of {pages}
  </p>
  {filtered.length===0?<EmptyState title="No interviews match these filters"
    description="Try another status, type or mode."/>:
   <div className="w-full overflow-x-auto rounded-[var(--lms-canvas-radius)] border border-border">
    <table className="w-full min-w-[950px] border-collapse text-left text-sm">
     <thead className="bg-surface-subtle"><tr>
      {["Candidate / Job","Type","Status","Date & Time","Duration","Interviewer","Location / Mode","Applications"].map(label=>
       <th scope="col" key={label} className="px-3 py-3 font-semibold">{label}</th>)}
     </tr></thead>
     <tbody>{pageItems.map(item=><tr key={item.id} className="border-t border-border align-top">
      <td className="max-w-[220px] break-words px-3 py-3">
       <strong className="block">{item.candidateName??"Candidate unavailable"}</strong>
       <span className="block text-xs text-body">{item.jobTitle} · {item.companyName}</span>
       {item.conflict?<StatusBadge tone="error">Conflict</StatusBadge>:null}
      </td>
      <td className="px-3 py-3">{item.type}</td>
      <td className="px-3 py-3"><StatusBadge tone={item.status==="CANCELLED"||item.status==="NO_SHOW"?"error":
       item.status==="COMPLETED"?"success":item.status==="RESCHEDULE_REQUESTED"?"warning":"info"}>{item.status.replaceAll("_"," ")}</StatusBadge></td>
      <td className="whitespace-nowrap px-3 py-3">{ist(item.startsAt)}</td>
      <td className="px-3 py-3">{Math.round((new Date(item.endsAt).getTime()-new Date(item.startsAt).getTime())/60000)} min</td>
      <td className="max-w-[120px] break-words px-3 py-3">{item.interviewer??"Not assigned"}</td>
      <td className="max-w-[160px] break-words px-3 py-3">{item.mode==="ONLINE"?"Online":"In-person"} · {item.mode==="ONLINE"?"Meeting link":item.venue}</td>
      <td className="px-3 py-3">
       <Link href={"/admin/placements/jobs/"+encodeURIComponent(item.jobId)+"/applications?"+
        new URLSearchParams({collegeId:result.collegeId,...item.applicationId?{applicationId:item.applicationId}:{}}).toString()}
        className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
        View applications</Link>
      </td>
     </tr>)}</tbody>
    </table>
   </div>}
  {pages>1?<nav aria-label="Interview appointment pages" className="flex items-center justify-between gap-3 text-sm">
   {selectedPage>1?<Link href={href(selectedPage-1)} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Previous</Link>:<span/>}
   <span>Page {selectedPage} of {pages}</span>
   {selectedPage<pages?<Link href={href(selectedPage+1)} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Next</Link>:<span/>}
  </nav>:null}
 </div>;
}
