import {getCurrentRequestContext} from "@/auth/request-context";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listSuperAdminJobSettings} from "@/modules/admin-ui/super-admin-placement-job-settings-service";
const statuses=["ALL","DRAFT","PUBLISHED","CLOSED","ARCHIVED"] as const;
export default async function SuperAdminJobSettingsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const context=await getCurrentRequestContext();
 return <AdminScopedReadPage backHref="/admin/placements" title="Placement Job Settings" path="/admin/placements/job-settings"
  description="Read-only published/draft lifecycle, deadlines and existing eligibility policy values. Missing fields are explicitly unconfigured, never represented as zero."
  statuses={statuses} searchParams={searchParams} loader={q=>listSuperAdminJobSettings(context,q)}/>;
}
