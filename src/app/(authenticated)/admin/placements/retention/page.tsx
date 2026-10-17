import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getSuperAdminPlacementRetentionReport} from "@/modules/admin-ui/super-admin-placement-retention-service";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
export default async function SuperAdminRetentionPage(){
 const context=await getCurrentRequestContext();
 if(!context.adminScope?.collegeId)return <div className="space-y-5"><PageHeader eyebrow="Super Admin · Placements" title="Data retention report"/>
  <EmptyState title="Select a college" description="Choose a college to review candidate retention candidates."/></div>;
 const report=await getSuperAdminPlacementRetentionReport(context);
 const fmt=(d:Date)=>d.toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"});
 return <main className="space-y-5">
  <PageHeader eyebrow="Super Admin · Placements" title="Data retention report"
   description="Applications withdrawn or rejected with no recorded application updates for at least 180 days."/>
  <nav><Link className="text-sm font-semibold text-primary-text underline" href="/admin/placements">← Placements</Link></nav>
  <p role="status" className="text-sm text-body">{report.rows.length} candidates for retention review{report.truncated?" (showing first 200)":""}; cutoff {fmt(new Date(report.cutoff))}.</p>
  <p className="rounded-lg border border-border bg-surface p-4 text-sm text-body">
   This is a review-only report, not an automated deletion or proof of legal retention eligibility. Account for offers, disputes and local retention policy before removing anything.
  </p>
  {report.rows.length?<div className="overflow-x-auto rounded-xl border border-border bg-surface">
   <table className="w-full min-w-[44rem] text-left text-sm">
    <thead><tr className="border-b border-border"><th className="p-3">Applicant</th><th className="p-3">Drive</th><th className="p-3">State</th><th className="p-3">Last updated</th><th className="p-3">Action</th></tr></thead>
    <tbody>{report.rows.map(row=><tr key={row.id} className="border-b border-border">
     <td className="p-3">{row.applicantName}</td><td className="p-3">{row.jobTitle}</td>
     <td className="p-3">{row.applicationStatus==="WITHDRAWN"?"Withdrawn":"Rejected"}</td>
     <td className="p-3">{fmt(row.lastUpdated)}</td>
     <td className="p-3"><Link href={"/admin/placements/applications/"+encodeURIComponent(row.id)} className="font-semibold text-primary-text underline">Review →</Link></td>
    </tr>)}</tbody></table></div>:<EmptyState title="No applications needing review" description="No rejected or withdrawn applications have passed the 180-day idle threshold."/>}
 </main>;
}
