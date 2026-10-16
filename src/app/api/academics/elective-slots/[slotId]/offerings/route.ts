import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listCollegeOfferingChoices} from "@/modules/electives/college-offering-choices-service";
import {createElectiveOffering} from "@/modules/electives/service";
export const runtime="nodejs";
type Params={params:Promise<{slotId:string}>};
export async function GET(_request:Request,{params}:Params){
 try{
  const context=await getCurrentRequestContext(),{slotId}=await params;
  const choices=await listCollegeOfferingChoices(context,slotId);
  return NextResponse.json(choices,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext(),{slotId}=await params;
  const {courseId,groupId,backedDeliveryId}=await request.json();
  const offering=await createElectiveOffering(context,{slotId,courseId,groupId,backedDeliveryId});
  return NextResponse.json({offering},{status:201});
 }catch(error){return apiErrorResponse(error);}
}
