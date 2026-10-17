import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {previewSuperAdminDriveArchive,archiveSuperAdminDrive}
 from "@/modules/placements/super-admin-drive-archive-service";
export const runtime="nodejs";
type Ctx={params:Promise<{jobId:string}>};
export async function GET(_request:Request,{params}:Ctx){
 try{const {jobId}=await params;
  return NextResponse.json(await previewSuperAdminDriveArchive(await getCurrentRequestContext(),jobId),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
export async function POST(request:Request,{params}:Ctx){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId}=await params;
  return NextResponse.json(await archiveSuperAdminDrive(await getCurrentRequestContext(),jobId,await request.json()));
 }catch(e){return apiErrorResponse(e);}
}
