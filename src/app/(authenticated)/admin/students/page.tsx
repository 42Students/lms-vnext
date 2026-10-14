import {getCurrentRequestContext} from "@/auth/request-context";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listAdminScopedPeople} from "@/modules/admin-ui/super-admin-scoped-people-service";
const statuses=["ALL","ACTIVE","SUSPENDED","ENDED"] as const;
export default async function SuperAdminStudentsPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 return <AdminScopedReadPage title="Students" path="/admin/students" statuses={statuses}
  exportPath="/api/admin/students/export" exportFilename="super-admin-students-ist.csv"
  description="Read-only learner memberships in the selected college, without private contact details. Use the scoped membership detail for authorized contact."
  searchParams={searchParams} loader={query=>listAdminScopedPeople(context,"LEARNER",query)}/>;
}
