import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {previewSuperAdminDriveArchive,archiveSuperAdminDrive}
 from "@/modules/placements/super-admin-drive-archive-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
type Ctx={params:Promise<{jobId:string}>};
async function handleGET(_request:Request,{params}:Ctx){
 try{const {jobId}=await params;
  return NextResponse.json(await previewSuperAdminDriveArchive(await getCurrentRequestContext(),jobId),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
export const GET = secured(handleGET);
async function handlePOST(request:Request,{params}:Ctx){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId}=await params;
  const parsed=await readBoundedJsonRequest(request,8192);
  if(!parsed.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  return NextResponse.json(await archiveSuperAdminDrive(await getCurrentRequestContext(),jobId,parsed.value));
 }catch(e){return apiErrorResponse(e);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
