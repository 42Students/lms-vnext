import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoInterviewSlotWorkspace,mutateTpoInterviewSlots} from "@/modules/placements/tpo-interview-slot-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Props={params:Promise<{jobId:string;roundId:string}>};
export async function GET(_req:Request,{params}:Props){
 try{const {jobId,roundId}=await params;
  return NextResponse.json(await getTpoInterviewSlotWorkspace(await getCurrentRequestContext(),jobId,roundId),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
export async function POST(req:Request,{params}:Props){
 if(!isSameOriginRequest(req))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId,roundId}=await params;
  return NextResponse.json(await mutateTpoInterviewSlots(await getCurrentRequestContext(),jobId,roundId,await req.json()),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
