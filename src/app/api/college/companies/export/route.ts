import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireRecentDeviceAuthentication} from "@/auth/recent-device-auth";
import {apiErrorResponse} from "@/lib/api-error";
import {parseCollegeCompaniesQuery} from "@/modules/placements/college-company-directory-model";
import {listCollegeCompanyDirectory} from "@/modules/placements/college-company-directory-service";
import {collegeCompanyCsv} from "@/modules/placements/college-directory-csv";
export const runtime="nodejs";
// Bound memory, database pagination and response size for tenant exports.
export const COLLEGE_COMPANY_EXPORT_CAP=5000;
export const GET = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    const raw=Object.fromEntries(new URL(request.url).searchParams);
    const parsed=parseCollegeCompaniesQuery(raw);
    if(!parsed.success)return NextResponse.json({error:"INVALID_COMPANY_FILTERS"},{status:400});
    await requireRecentDeviceAuthentication(context.user.id);
    const first=await listCollegeCompanyDirectory(context,parsed.data,{exportAll:true});
    const all=[...first.items];
    while(all.length<Math.min(first.total,COLLEGE_COMPANY_EXPORT_CAP)){
   const batch=await listCollegeCompanyDirectory(context,parsed.data,{exportAll:true,exportOffset:all.length});
   if(batch.items.length===0)break;
   all.push(...batch.items.slice(0,COLLEGE_COMPANY_EXPORT_CAP-all.length));
  }
    const incomplete=all.length<first.total;
    return new Response(collegeCompanyCsv(all),{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="companies.csv"',
    "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
    "X-Export-Scope":"COLLEGE_COMPANY_RELATIONSHIP",
    "X-Export-Contact-Fields":"UNAVAILABLE_IN_CURRENT_SCHEMA",
    "X-Export-Truncated":incomplete?"true":"false",
    "X-Export-Row-Cap":String(COLLEGE_COMPANY_EXPORT_CAP),
    "X-Export-Total":String(first.total),
    "X-Export-Included":String(all.length)},
  });
  },
);
