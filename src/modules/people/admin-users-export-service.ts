import "server-only";
import type { RequestContext } from "@/modules/identity/context";
import { listSuperAdminUsers } from "./admin-user-directory-service";
import { adminUsersExportQuerySchema,buildSuperAdminPeopleCsv,SUPER_ADMIN_PEOPLE_CSV_CAP } from "./admin-users-export-model";
export async function exportSuperAdminUsers(context:RequestContext,raw:unknown) {
 const query=adminUsersExportQuerySchema.parse(raw);
 const first=await listSuperAdminUsers(context,{...query,page:1});
 const items=[...first.items];
 for(let page=2;page<=first.totalPages&&items.length<SUPER_ADMIN_PEOPLE_CSV_CAP;page++){
  const next=await listSuperAdminUsers(context,{...query,page});
  items.push(...next.items);
 }
 return {csv:buildSuperAdminPeopleCsv(items,first.total>SUPER_ADMIN_PEOPLE_CSV_CAP),
  exported:Math.min(items.length,SUPER_ADMIN_PEOPLE_CSV_CAP),truncated:first.total>SUPER_ADMIN_PEOPLE_CSV_CAP,cap:SUPER_ADMIN_PEOPLE_CSV_CAP};
}
