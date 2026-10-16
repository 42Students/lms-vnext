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
  return NextResponse.json(await mutateCollegeApplicationStages(await getCurrentRequestContext(),jobId,await req.json()),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
