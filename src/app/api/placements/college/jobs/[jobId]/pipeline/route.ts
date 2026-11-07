import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getCollegeApplicationPipeline,mutateCollegeApplicationStages} from "@/modules/placements/college-application-stage-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Props={params:Promise<{jobId:string}>};
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request: req, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    return NextResponse.json(await getCollegeApplicationPipeline(__ctx,jobId,
   Object.fromEntries(new URL(req.url).searchParams)),{headers:{"Cache-Control":"private, no-store"}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request: req, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    const result=await mutateCollegeApplicationStages(
   __ctx,jobId,await boundedRequestJson(req));
    const safeResults=result.results.map(item=>({
   applicationId:item.applicationId,status:item.status,
   ...(item.stage?{stage:item.stage}:{}),
   ...(item.status==="skipped"?{reason:"This application's stage changed or its transition is not allowed. Refresh before retrying."}:{}),
  }));
    return NextResponse.json({...result,results:safeResults,
   partial:result.skipped>0&&result.moved>0,
   canonicalApplicationStatusUnchanged:true,
   ...(result.skipped>0?{retryHref:"/college/placements/jobs/"+
     encodeURIComponent(jobId)+"/applications"}:{})},
   {status:result.moved===0&&result.skipped>0?409:200,
    headers:{"Cache-Control":"private, no-store"}});
  },
);
