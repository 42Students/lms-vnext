import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import { ErrorState } from "@/components/ui/error-state";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { driveInterviewsHref, driveInterviewsParams, driveRoundTime } from "@/modules/placements/college-drive-interviews-model";
import { listCollegeDriveInterviews } from "@/modules/placements/college-drive-interviews-service";
import { getCollegeRoundSlotAppointments } from "@/modules/placements/college-round-slot-action-service";
import { CollegeInterviewAppointments } from "@/components/placements/college-interview-appointments";

function adminInterviewsHref(...args:Parameters<typeof driveInterviewsHref>){
 return driveInterviewsHref(...args).replace("/college/placements/","/admin/placements/");
}
export default async function SuperAdminDriveSchedulePage({params,searchParams}:{
  params:Promise<{jobId:string}>;
  searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
  const context=await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="min-w-0 space-y-4">
    <PageHeader title="Placement Drives" description="Placement administration requires a college safety scope." />
    <EmptyState title="Choose a college" description="Select a college in the Super Admin scope selector to manage its drives."/>
  </div>;
  // Validate the platform actor and selected tenant before reading private rounds.
  requireSuperAdminSelectedCollege(context,"placements.manage");
  const {jobId}=await params;
  const query=driveInterviewsParams(await searchParams);
  if(!query) return <div className="min-w-0 space-y-5">
    <PageHeader title="Interviews" description="Schedule candidate interviews and review interview rounds."/>
    <ErrorState title="Invalid interview filters"
      description="Round kind, status or page is invalid. No records were loaded."
      action={<Link href={"/admin/placements/jobs/"+encodeURIComponent(jobId)+"/schedule"}
        className="font-semibold text-primary-text underline">Clear filters</Link>}/>
  </div>;
  const [data,appointments]=await Promise.all([
    listCollegeDriveInterviews(context,jobId,query),
    getCollegeRoundSlotAppointments(context,jobId),
  ]);
  const columns:DataTableColumn<(typeof data.items)[number]>[]=[
    {key:"round",header:"Round",mobilePriority:"primary",cell:item=><>
      <strong>{item.name}</strong><p className="text-xs text-muted-foreground">{item.kind} · Round {item.sequence}</p></>},
    {key:"time",header:"Time",mobilePriority:"secondary",cell:item=>driveRoundTime(item.scheduledAt,item.timezone)},
    {key:"venue",header:"Venue",mobilePriority:"secondary",cell:item=>item.venue??"Not recorded"},
    {key:"mode",header:"Mode",mobilePriority:"secondary",cell:item=>item.mode??"Not recorded"},
    {key:"status",header:"Status",mobilePriority:"secondary",cell:item=><StatusBadge tone={item.status==="COMPLETED"?"success":item.status==="SCHEDULED"?"info":item.status==="CANCELLED"?"neutral":"warning"}>{item.status}</StatusBadge>},
    {key:"slots",header:"Candidate slots",mobilePriority:"secondary",cell:()=> "See candidate interviews above"},
  ];
  return <div className="min-w-0 space-y-6">
    
    <PageHeader title={"Interviews · "+data.job.title}
      description="Schedule candidate interviews, track completed and no-show outcomes, and review interview rounds."
      actions={<PageBackLink href={"/admin/placements/jobs/"+encodeURIComponent(jobId)} label="Drive overview" />} />
    <form method="get" className="grid min-w-0 grid-cols-1 items-end gap-4 border-b border-border pb-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
      <label className="grid gap-1 text-sm">Round kind
        <Select name="kind" defaultValue={query.kind} className="min-w-0">
          <option value="ALL">Interview and GD</option><option value="INTERVIEW">Interview</option><option value="GD">GD</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm">Status
        <Select name="status" defaultValue={query.status} className="min-w-0">
          {["ALL","PENDING","SCHEDULED","COMPLETED","CANCELLED"].map(status=>
            <option key={status} value={status}>{status}</option>)}
        </Select>
      </label>
      <Button type="submit">Filter</Button>
    </form>
    <CollegeInterviewAppointments jobId={jobId} rounds={appointments.rounds}
      candidates={appointments.candidates} appointments={appointments.interviews}
      preferredApplicationId={query.applicationId}/>
    <section aria-label="Persisted interview rounds" className="min-w-0 space-y-3 border-b border-border pb-5">
      <p className="text-sm text-muted-foreground">{data.total} matching interview/GD rounds</p>
      <DataTable columns={columns} rows={data.items} getRowKey={item=>item.id}
        caption="Persisted interview rounds"
        empty={<EmptyState title={data.total===0?"No matching interview rounds":"No rounds on this page"}
          description={data.total===0?"No persisted interview or GD rounds match these filters.":"No rows on this page; select an earlier page."}/>}/>
    </section>
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Page {query.page} of {data.totalPages}</p>
      <Pagination page={query.page} pageCount={data.totalPages}
        hrefForPage={page=>adminInterviewsHref(jobId,{...query,page})} label="Interview round pages"/>
    </div>
    <p className="text-xs text-muted-foreground">
      Interview appointments use the registered candidate-slot schedule. Confirmed outcomes are stored as immutable audit events.
    </p>
  </div>;
}
