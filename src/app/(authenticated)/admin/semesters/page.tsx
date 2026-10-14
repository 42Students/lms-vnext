import { getCurrentRequestContext } from "@/auth/request-context";
import { AdminScopedReadPage } from "@/components/admin/admin-scoped-read-page";
import { listAdminSemesters } from "@/modules/admin-ui/super-admin-semesters-service";
const statuses=["ALL","ACTIVE","INACTIVE"] as const;
export default async function SuperAdminSemestersPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
 const context=await getCurrentRequestContext();
 return <AdminScopedReadPage title="Semesters" path="/admin/semesters"
  exportPath="/api/admin/semesters/export" exportFilename="super-admin-semesters-ist.csv"
  description="Persisted program terms in the selected college. This is read-only, not a course mapping editor."
  statuses={statuses} searchParams={searchParams}
  loader={query=>listAdminSemesters(context,query)}/>;
}
