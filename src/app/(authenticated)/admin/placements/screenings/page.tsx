import {getCurrentRequestContext} from "@/auth/request-context";
import Link from "next/link";
import { Banner } from "@/components/ui/banner";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listSuperAdminScreeningQueue} from "@/modules/admin-ui/super-admin-placement-screenings-service";
const statuses=["ALL","PENDING","HOLD","REJECTED"] as const;
export default async function SuperAdminScreeningsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const context=await getCurrentRequestContext();
 return <AdminScopedReadPage compactReadLayout backHref="/admin/placements" title="Application Screening Queue" path="/admin/placements/screenings"
  description="Read-only human screening decisions for the selected college: Pending review, Hold and Rejected. Automated score outcomes are distinct. Shortlisted outcomes appear separately; notes remain private."
  intro={<div className="min-w-0 space-y-3">
    <Banner tone="info" role="status">
      This queue records <strong>human screening decisions</strong> (Pending review,
      Hold and Rejected). Legacy automated screening used Pending while a
      scoring job ran, Completed after a score was produced, and Failed for
      processing errors. Those are different processes, not interchangeable
      status values. No asynchronous auto-scoring is run in this LMS.
    </Banner>
    <p className="text-sm leading-6 text-body">
      Legacy score-based rankings belong to individual, authorized job
      applications, not this manual decision queue. Open each application
      for any recorded assessment scores and the appropriate job context.
      Missing scores are never treated as zero or sorted ahead of scores.
      <Link href="/admin/placements/applications"
       className="ml-2 font-semibold text-primary-text underline">View applications and scores</Link>
    </p>
  </div>}
  statuses={statuses} searchParams={searchParams} loader={q=>listSuperAdminScreeningQueue(context,q)}/>;
}
