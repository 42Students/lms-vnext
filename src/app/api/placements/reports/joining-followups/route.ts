import { route } from "@/security/route";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoJoiningFollowups} from "@/modules/placements/tpo-joining-followup-service";
import {tpoJoiningFollowupCsv} from "@/modules/placements/tpo-joining-followup-model";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const query=Object.fromEntries(new URL(request.url).searchParams.entries());
const report=await getTpoJoiningFollowups(context,query);
if(!report.season)return Response.json({error:"PLACEMENT_SEASON_NOT_FOUND"},{status:404,
   headers:{"Cache-Control":CACHE.PRIVATE_STRICT}});
const exportData=tpoJoiningFollowupCsv(report,report.season.name);
return new Response("\uFEFF"+exportData.csv,{status:200,headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="tpo-joining-followups.csv"',
   "Cache-Control":CACHE.PRIVATE_STRICT,
   "X-Content-Type-Options":"nosniff",
   Vary:"Cookie",
   "X-Export-Truncated":String(exportData.truncated||report.truncated),
  }});
} catch(error){const res=apiErrorResponse(error);res.headers.set("Cache-Control","private, no-store, max-age=0");return res;}
  },
);
