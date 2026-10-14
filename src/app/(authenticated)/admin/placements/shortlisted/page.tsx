import {getCurrentRequestContext} from "@/auth/request-context";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listSuperAdminShortlisted} from "@/modules/admin-ui/super-admin-placement-shortlisted-service";
const statuses=["ALL","SUBMITTED","WITHDRAWN"] as const;
export default async function SuperAdminShortlistedPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const context=await getCurrentRequestContext();
 return <AdminScopedReadPage title="Shortlisted Applicants" path="/admin/placements/shortlisted"
  description="Read-only, persisted SHORTLISTED screening outcomes in your selected college. Status filters refer to application submission/withdrawal; recruiter-only notes are never displayed."
  statuses={statuses} searchParams={searchParams} loader={q=>listSuperAdminShortlisted(context,q)}/>;
}
