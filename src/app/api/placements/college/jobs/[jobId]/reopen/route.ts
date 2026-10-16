import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {reopenCollegeDrive} from "@/modules/placements/college-drive-reopen-service";
export const runtime="nodejs";
type Props={params:Promise<{jobId:string}>};
export async function POST(req:Request,{params}:Props){
 if(!isSameOriginRequest(req))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId}=await params;
  return NextResponse.json(await reopenCollegeDrive(await getCurrentRequestContext(),jobId,
   await req.json()),{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
