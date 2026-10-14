import {getCurrentRequestContext} from "@/auth/request-context";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listAdminBatches} from "@/modules/admin-ui/super-admin-batches-service";
const statuses=["ALL","PLANNED","ACTIVE","COMPLETED","ARCHIVED"] as const;
export default async function SuperAdminBatchesPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 return <AdminScopedReadPage title="Batches" path="/admin/batches" statuses={statuses}
  description="Read-only persisted batches and their program/start period. Promotion and student moves remain separate workflows."
  searchParams={searchParams} loader={query=>listAdminBatches(context,query)}/>;
}
