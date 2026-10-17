import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {editSuperAdminPublishedDrive} from "@/modules/placements/super-admin-published-drive-edit-service";
export const runtime="nodejs";
type Ctx={params:Promise<{jobId:string}>};
export async function PATCH(request:Request,{params}:Ctx){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId}=await params;
  return NextResponse.json(await editSuperAdminPublishedDrive(
   await getCurrentRequestContext(),jobId,await request.json()));
 }catch(e){return apiErrorResponse(e);}
}
