import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getCollegeApplicationPipeline,mutateCollegeApplicationStages} from "@/modules/placements/college-application-stage-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Props={params:Promise<{jobId:string}>};
export async function GET(req:Request,{params}:Props){
 try{const {jobId}=await params;
  return NextResponse.json(await getCollegeApplicationPipeline(await getCurrentRequestContext(),jobId,
   Object.fromEntries(new URL(req.url).searchParams)),{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
export async function POST(req:Request,{params}:Props){
 if(!isSameOriginRequest(req))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId}=await params;
  const result=await mutateCollegeApplicationStages(
   await getCurrentRequestContext(),jobId,await req.json());
  // Stage changes do not rewrite the canonical placement application status.
  // A partial bulk operation is a truthful 200 receipt, never full success.
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
 }catch(e){return apiErrorResponse(e);}
}
