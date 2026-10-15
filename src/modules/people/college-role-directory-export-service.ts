import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {collegeRoleDirectoryQuerySchema,type CollegeDirectoryKind} from "./college-role-directory-model";
import {listCollegeRoleDirectory} from "./college-role-directory-service";
import {ROLE_DIRECTORY_EXPORT_LIMIT,renderCollegeRoleDirectoryCsv} from "./college-role-directory-export";

/** Re-evaluates college membership authorization on every paginated read. No supplied college scope. */
export async function exportCollegeRoleDirectoryCsv(context:RequestContext,kind:CollegeDirectoryKind,raw:unknown){
 const filter=collegeRoleDirectoryQuerySchema.parse(raw);
 const pageSize=50,rows:Awaited<ReturnType<typeof listCollegeRoleDirectory>>["items"][number][]=[];
 let total=0;
 for(let page=1;page<=ROLE_DIRECTORY_EXPORT_LIMIT/pageSize;page++){
  const result=await listCollegeRoleDirectory(context,kind,{...filter,page,pageSize});
  if(page===1)total=result.total;
  rows.push(...result.items);
  if(result.items.length<pageSize||rows.length>=total)break;
 }
 return {csv:renderCollegeRoleDirectoryCsv(kind,rows,total>ROLE_DIRECTORY_EXPORT_LIMIT),
   total,exported:rows.length,truncated:total>ROLE_DIRECTORY_EXPORT_LIMIT};
}
