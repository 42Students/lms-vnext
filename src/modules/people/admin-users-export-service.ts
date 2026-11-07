import "server-only";
import type { RequestContext } from "@/modules/identity/context";
import { listSuperAdminUsers } from "./admin-user-directory-service";
import { adminUsersExportQuerySchema,buildSuperAdminPeopleCsv,SUPER_ADMIN_PEOPLE_CSV_CAP } from "./admin-users-export-model";
export async function exportSuperAdminUsers(context:RequestContext,raw:unknown) {
 const query=adminUsersExportQuerySchema.parse(raw);
 const first=await listSuperAdminUsers(context,{...query,page:1});
 const items=first.items.slice(0,SUPER_ADMIN_PEOPLE_CSV_CAP);
 const seen=new Set(items.map(row=>row.membershipId));
 for(let page=2;page<=first.totalPages&&items.length<SUPER_ADMIN_PEOPLE_CSV_CAP;page++){
  const next=await listSuperAdminUsers(context,{...query,page});
  for(const row of next.items){
   if(items.length>=SUPER_ADMIN_PEOPLE_CSV_CAP)break;
   if(seen.has(row.membershipId))continue;
   seen.add(row.membershipId);items.push(row);
  }
 }
 const truncated=first.total>SUPER_ADMIN_PEOPLE_CSV_CAP||
  items.length<Math.min(first.total,SUPER_ADMIN_PEOPLE_CSV_CAP);
 return {csv:buildSuperAdminPeopleCsv(items,truncated),
  exported:items.length,truncated,cap:SUPER_ADMIN_PEOPLE_CSV_CAP};
}
