import {getCurrentRequestContext} from "@/auth/request-context";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listAdminClasses} from "@/modules/admin-ui/super-admin-classes-service";
const statuses=["ALL","ACTIVE","ARCHIVED"] as const;
export default async function SuperAdminClassesPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 return <AdminScopedReadPage title="Classes / Sections" path="/admin/classes" statuses={statuses}
  description="Read-only class structure in your selected college. Open a class workspace for scoped roster and schedule."
  searchParams={searchParams} loader={query=>listAdminClasses(context,query)}/>;
}
