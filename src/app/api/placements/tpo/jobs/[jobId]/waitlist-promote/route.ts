import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
import {getTpoWaitlistPreview,offerToNextWaitlisted} from "@/modules/placements/tpo-waitlist-promotion-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Props={params:Promise<{jobId:string}>};
export async function GET(_req:Request,{params}:Props){
 try{const {jobId}=await params;
  return NextResponse.json(await getTpoWaitlistPreview(await getCurrentRequestContext(),jobId),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
export async function POST(req:Request,{params}:Props){
 if(!isSameOriginRequest(req))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId}=await params;
  return NextResponse.json(await offerToNextWaitlisted(await getCurrentRequestContext(),jobId,await readTpoBulkRequestBody(req)),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){
  if(e instanceof TpoBulkBodyError)return NextResponse.json({error:e.message},
   {status:e.status,headers:{"Cache-Control":"private, no-store"}});
  return apiErrorResponse(e);
 }
}
