import {getCurrentRequestContext} from "@/auth/request-context";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listAdminScopedPeople} from "@/modules/admin-ui/super-admin-scoped-people-service";
const statuses=["ALL","ACTIVE","SUSPENDED","ENDED"] as const;
export default async function SuperAdminFacultyPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 return <AdminScopedReadPage title="Faculty" path="/admin/faculty" statuses={statuses}
  exportPath="/api/admin/faculty/export" exportFilename="super-admin-faculty-ist.csv"
  description="Read-only faculty memberships in the selected college. Contact details stay in the permission-checked membership detail."
  searchParams={searchParams} loader={query=>listAdminScopedPeople(context,"FACULTY",query)}/>;
}
