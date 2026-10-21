import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readAdminPlacementJson} from "@/modules/placements/admin-request-body-model";
import {editSuperAdminPublishedDrive} from "@/modules/placements/super-admin-published-drive-edit-service";
export const runtime="nodejs";
type Ctx={params:Promise<{jobId:string}>};
export async function PATCH(request:Request,{params}:Ctx){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  // A published edit can contain a 15,000-character description plus
  // locations/reason. Deny a larger stream before loading selected scope.
  const body=await readAdminPlacementJson(request,49152);
  if(!body.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const {jobId}=await params;
  return NextResponse.json(await editSuperAdminPublishedDrive(
   await getCurrentRequestContext(),jobId,body.value));
 }catch(e){return apiErrorResponse(e);}
}
