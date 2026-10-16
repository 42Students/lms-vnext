import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {applyTpoWholeRound,getTpoRoundApplyPreview} from "@/modules/placements/tpo-round-apply-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Params={params:Promise<{jobId:string;roundId:string}>};
export async function GET(_request:Request,{params}:Params){
 try{const {jobId,roundId}=await params;
  const data=await getTpoRoundApplyPreview(await getCurrentRequestContext(),jobId,roundId);
  return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
export async function POST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId,roundId}=await params;
  const result=await applyTpoWholeRound(await getCurrentRequestContext(),jobId,roundId,await request.json());
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
