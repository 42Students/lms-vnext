import {getCurrentRequestContext} from "@/auth/request-context";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listSuperAdminHiringByJob} from "@/modules/admin-ui/super-admin-placement-hiring-service";
const statuses=["ALL","DRAFT","PUBLISHED","CLOSED","ARCHIVED"] as const;
export default async function SuperAdminHiringPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const context=await getCurrentRequestContext();
 return <AdminScopedReadPage backHref="/admin/placements" title="Hiring Dashboard · Applications" path="/admin/placements/hiring"
  description="Job-level persisted applicant counts for the selected college. These are applications, not unique candidates, interview passes or offers; no fabricated funnel conversion."
  statuses={statuses} searchParams={searchParams} loader={q=>listSuperAdminHiringByJob(context,q)}/>;
}
