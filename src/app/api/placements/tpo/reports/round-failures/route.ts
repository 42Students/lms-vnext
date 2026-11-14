import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {tpoReportHasRepeatedSearchParams} from "@/modules/placements/tpo-report-url-guard";
import {hasMembershipRole} from "@/modules/identity/context";
import {getPlacementFailureReasonsReport} from "@/modules/placements/report-extra-service";
import {tpoRoundFailureCsvQuerySchema,tpoRoundFailureCsv} from "@/modules/placements/tpo-round-failure-csv-model";
import { ROLE } from "@/modules/identity/roles";
import { CACHE, privateJson } from "@/security/responses";
import { attachmentHeader } from "@/security/downloads";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
if(!context.membership||!hasMembershipRole(context,ROLE.TPO))
   return privateJson({error:"UNAUTHORIZED"}, { status: 403 });
const params=new URL(request.url).searchParams;
if(tpoReportHasRepeatedSearchParams(params))return NextResponse.json({error:"INVALID_QUERY"},{
   status:400,headers:{"Cache-Control":CACHE.PRIVATE},
  });
const query=tpoRoundFailureCsvQuerySchema.parse(Object.fromEntries(params.entries()));
const report=await getPlacementFailureReasonsReport(context,{
   collegeId:context.membership.collegeId,...query,
  });
const rows=report.roundBranchFailureShares.slice(0,5000);
return new Response(tpoRoundFailureCsv(rows),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":attachmentHeader("round-failures-by-branch.csv"),
   "Cache-Control":CACHE.PRIVATE_STRICT,
   "X-Content-Type-Options":"nosniff",
   "X-Export-Truncated":String(report.roundBranchFailureShares.length>rows.length),
   Vary:"Cookie",
  }});
} catch(error){const response=apiErrorResponse(error);response.headers.set("Cache-Control","private, no-store");return response;}
  },
);
