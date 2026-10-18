import {SuperAdminDriveTabs} from "@/components/placements/super-admin-drive-tabs";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import { ErrorState } from "@/components/ui/error-state";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
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
    <PageHeader eyebrow="Super Admin" title="Placement Drives" description="Placement administration requires a college safety scope." />
    <EmptyState title="Choose a college" description="Select a college in the Super Admin scope selector to manage its drives."/>
  </div>;
  // Validate the platform actor and selected tenant before reading private rounds.
  requireSuperAdminSelectedCollege(context,"placements.manage");
  const {jobId}=await params;
  const query=driveInterviewsParams(await searchParams);
  if(!query) return <ErrorState title="Invalid interview filters"
    description="Round kind, status or page is invalid. No records were loaded." />;
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
    {key:"status",header:"Status",mobilePriority:"secondary",cell:item=>item.status},
    {key:"slots",header:"Candidate slots",mobilePriority:"secondary",cell:()=> "See candidate interviews above"},
  ];
  return <div className="min-w-0 space-y-6">
    <SuperAdminDriveTabs jobId={jobId} active="Schedule"/>
    <PageHeader eyebrow="Super Admin · Placements" title={"Interviews · "+data.job.title}
      description="Schedule candidate interviews, track completed and no-show outcomes, and review interview rounds."
      actions={<Link href={`/admin/placements/jobs/${jobId}`} className="inline-flex min-h-11 items-center text-[var(--lms-teal-deep)] underline">Drive overview</Link>} />
    <form method="get" className="flex flex-wrap items-end gap-4 rounded-xl border border-border p-4">
      <label className="grid gap-1 text-sm">Round kind
        <Select name="kind" defaultValue={query.kind} className="min-h-11 rounded-md border border-border px-2">
          <option value="ALL">Interview and GD</option><option value="INTERVIEW">Interview</option><option value="GD">GD</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm">Status
        <Select name="status" defaultValue={query.status} className="min-h-11 rounded-md border border-border px-2">
          {["ALL","PENDING","SCHEDULED","COMPLETED","CANCELLED"].map(status=>
            <option key={status} value={status}>{status}</option>)}
        </Select>
      </label>
      <Button type="submit">Filter</Button>
    </form>
    <CollegeInterviewAppointments jobId={jobId} rounds={appointments.rounds}
      candidates={appointments.candidates} appointments={appointments.interviews}
      preferredApplicationId={query.applicationId}/>
    <section aria-label="Persisted interview rounds" className="min-w-0 space-y-3 rounded-xl border border-border bg-surface p-4">
      <p className="text-sm text-muted-foreground">{data.total} matching interview/GD rounds</p>
      <DataTable columns={columns} rows={data.items} getRowKey={item=>item.id}
        caption="Persisted interview rounds"
        empty={<p role="status" className="text-sm text-body">{data.total===0?
          "No persisted interview or GD rounds match these filters.":"No rows on this page; select an earlier page."}</p>}/>
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
