import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import {getSuperAdminPlacementRetentionReport} from "@/modules/admin-ui/super-admin-placement-retention-service";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {StatusBadge} from "@/components/ui/status-badge";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
import {EmptyState} from "@/components/ui/empty-state";
import {Banner} from "@/components/ui/banner";
import {ErrorState} from "@/components/ui/error-state";
export default async function SuperAdminRetentionPage(){
 const context=await getCurrentRequestContext();
 if(!context.adminScope?.collegeId)return <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)]"><PageHeader title="Data retention report" actions={<PageBackLink href="/admin/placements" label="Placements" />}/>
  <EmptyState title="Select a college" description="Choose a college to review candidate retention candidates."/></div>;
 requireSuperAdminSelectedCollege(context,"placements.read");
 let report:Awaited<ReturnType<typeof getSuperAdminPlacementRetentionReport>>;
 try {
  report=await getSuperAdminPlacementRetentionReport(context);
 } catch {
  return <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)]">
   <PageHeader title="Data retention report" actions={<PageBackLink href="/admin/placements" label="Placements" />}/>
   <ErrorState title="Couldn't load the data retention report."
    description="The retention review could not be loaded. Nothing has been deleted or marked for deletion."
    action={<Link href="/admin/placements/retention?retry=1" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] px-4 font-semibold text-primary-text hover:border-[var(--lms-primary)] md:min-h-9">Retry</Link>}/>
  </div>;
 }
 const fmt=(d:Date)=>d.toLocaleDateString("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
 const columns:DataTableColumn<(typeof report.rows)[number]>[]=[
  {key:"applicant",header:"Applicant",mobilePriority:"primary",cell:row=><strong className="block min-w-0 break-words font-semibold text-[var(--lms-heading)]">{row.applicantName}</strong>},
  {key:"drive",header:"Drive",mobilePriority:"secondary",cell:row=><span className="block min-w-0 break-words">{row.jobTitle}</span>},
  {key:"state",header:"State",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.applicationStatus==="WITHDRAWN"?"neutral":"error"}>{row.applicationStatus==="WITHDRAWN"?"Withdrawn":"Rejected"}</StatusBadge>},
  {key:"updated",header:"Last updated",mobilePriority:"secondary",cell:row=>fmt(row.lastUpdated)},
  {key:"action",header:"Action",mobilePriority:"action",cell:row=><Link href={"/admin/placements/applications/"+encodeURIComponent(row.id)}
   className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Review →</Link>},
 ];
 return <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
  <PageHeader title="Data retention report"
   description="Applications withdrawn or rejected with no recorded application updates for at least 180 days."
   actions={<PageBackLink href="/admin/placements" label="Placements" />}/>
  <Banner tone="warning">
   This is a review-only report, not an automated deletion or proof of legal retention eligibility. Account for offers, disputes and local retention policy before removing anything.
  </Banner>
  <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)] text-sm sm:flex-row sm:items-center sm:justify-between">
    <p role="status" className="font-semibold text-[var(--lms-heading)] tabular-nums">{report.rows.length} candidates for retention review{report.truncated?" (showing first 200)":""}</p>
    <p className="text-sm text-muted-foreground">Cutoff: <time dateTime={report.cutoff}>{fmt(new Date(report.cutoff))}</time></p>
  </div>
  <DataTable columns={columns} rows={report.rows} getRowKey={row=>row.id}
    caption="Data retention report" empty={<EmptyState title="No applications needing review"
    description="No rejected or withdrawn applications have passed the 180-day idle threshold."/>}/>
 </div>;
}
