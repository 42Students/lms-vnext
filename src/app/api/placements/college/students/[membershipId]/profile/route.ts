import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {editCollegeStudentPlacementProfile} from "@/modules/placements/college-placement-profile-service";
export const runtime="nodejs";
export async function PATCH(request:Request,{params}:{
 params:Promise<{membershipId:string}>;
}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {membershipId}=await params;
  const body=await request.json() as Record<string,unknown>;
  const result=await editCollegeStudentPlacementProfile(
   await getCurrentRequestContext(),{...body,membershipId});
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
