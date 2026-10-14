import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {editTpoDrive} from "@/modules/placements/tpo-drive-edit-service";
export const runtime="nodejs";
export async function PATCH(request:Request,{params}:{params:Promise<{jobId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId}=await params;
  return NextResponse.json(await editTpoDrive(await getCurrentRequestContext(),jobId,await request.json()));
 }catch(error){return apiErrorResponse(error);}
}
