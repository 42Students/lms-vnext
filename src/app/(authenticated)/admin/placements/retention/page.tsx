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
export default async function SuperAdminRetentionPage(){
 const context=await getCurrentRequestContext();
 if(!context.adminScope?.collegeId)return <div className="min-w-0 space-y-5"><PageHeader title="Data retention report"/>
  <EmptyState title="Select a college" description="Choose a college to review candidate retention candidates."/></div>;
 requireSuperAdminSelectedCollege(context,"placements.read");
 const report=await getSuperAdminPlacementRetentionReport(context);
 const fmt=(d:Date)=>d.toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"});
 const columns:DataTableColumn<(typeof report.rows)[number]>[]=[
  {key:"applicant",header:"Applicant",mobilePriority:"primary",cell:row=>row.applicantName},
  {key:"drive",header:"Drive",mobilePriority:"secondary",cell:row=>row.jobTitle},
  {key:"state",header:"State",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.applicationStatus==="WITHDRAWN"?"neutral":"warning"}>{row.applicationStatus==="WITHDRAWN"?"Withdrawn":"Rejected"}</StatusBadge>},
  {key:"updated",header:"Last updated",mobilePriority:"secondary",cell:row=>fmt(row.lastUpdated)},
  {key:"action",header:"Action",mobilePriority:"action",cell:row=><Link href={"/admin/placements/applications/"+encodeURIComponent(row.id)}
   className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Review →</Link>},
 ];
 return <div className="min-w-0 space-y-5">
  <PageHeader title="Data retention report"
   description="Applications withdrawn or rejected with no recorded application updates for at least 180 days."
   actions={<PageBackLink href="/admin/placements" label="Placements" />}/>
  <p role="status" className="text-sm text-body tabular-nums">{report.rows.length} candidates for retention review{report.truncated?" (showing first 200)":""}; cutoff {fmt(new Date(report.cutoff))}.</p>
  <Banner tone="warning">
   This is a review-only report, not an automated deletion or proof of legal retention eligibility. Account for offers, disputes and local retention policy before removing anything.
  </Banner>
  <DataTable columns={columns} rows={report.rows} getRowKey={row=>row.id}
    caption="Data retention report" empty={<EmptyState title="No applications needing review"
    description="No rejected or withdrawn applications have passed the 180-day idle threshold."/>}/>
 </div>;
}
