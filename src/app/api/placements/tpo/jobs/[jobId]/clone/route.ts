import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {cloneTpoDrive} from "@/modules/placements/tpo-drive-clone-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Props={params:Promise<{jobId:string}>};
async function handlePOST(request:Request,{params}:Props){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {jobId}=await params;
  const copied=await cloneTpoDrive(await getCurrentRequestContext(),jobId,await request.json());
  return NextResponse.json(copied,{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
