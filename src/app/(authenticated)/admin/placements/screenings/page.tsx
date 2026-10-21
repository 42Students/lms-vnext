import {getCurrentRequestContext} from "@/auth/request-context";
import Link from "next/link";
import { Banner } from "@/components/ui/banner";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listSuperAdminScreeningQueue} from "@/modules/admin-ui/super-admin-placement-screenings-service";
const statuses=["ALL","PENDING","HOLD","REJECTED"] as const;
export default async function SuperAdminScreeningsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const context=await getCurrentRequestContext();
 return <AdminScopedReadPage compactReadLayout backHref="/admin/placements" title="Application Screening Queue" path="/admin/placements/screenings"
  description="Read-only pending, held and rejected screening records from the selected college. Shortlisted outcomes appear in their separate view. Internal notes are private."
  intro={<Banner tone="info" role="status">
    Application screening decisions and assessment scores are separate records.
    This queue contains persisted decisions, not a verified skill-score column.
    Open an authorized application detail or its drive screening workspace for
    available evidence; no missing score is represented as zero.
    <Link href="/admin/placements/applications"
      className="ml-2 font-semibold text-primary-text underline">View applications</Link>
  </Banner>}
  statuses={statuses} searchParams={searchParams} loader={q=>listSuperAdminScreeningQueue(context,q)}/>;
}
