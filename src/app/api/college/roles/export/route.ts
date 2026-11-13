import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireRecentDeviceAuthentication} from "@/auth/recent-device-auth";
import {apiErrorResponse} from "@/lib/api-error";
import {parseCollegeRoleDirectoryExportQuery} from "@/modules/people/college-role-directory-export";
import {exportCollegeRoleDirectoryCsv} from "@/modules/people/college-role-directory-export-service";

import { ROLE } from "@/modules/identity/roles";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const {kind,filter}=parseCollegeRoleDirectoryExportQuery(new URL(request.url).searchParams);
await requireRecentDeviceAuthentication(context.user.id);
const report=await exportCollegeRoleDirectoryCsv(context,kind,filter);
return new Response(report.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="college-'+(kind===ROLE.FACULTY?"faculty":"students")+'-filtered.csv"',
   "Cache-Control":"private, no-store",
   "X-Export-Total":String(report.total),
   "X-Export-Truncated":String(report.truncated),
  }});
} catch(error){
  if(error instanceof Error&&error.message==="INVALID_ROLE_DIRECTORY_EXPORT")
   return NextResponse.json({error:"INVALID_ROLE_DIRECTORY_EXPORT"},{status:400});
  return apiErrorResponse(error);
 }
  },
);
