import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {joinOwnGroup} from "@/modules/groups/service";
import {getLearnerGroupDetail} from "@/modules/groups/learner-group-detail-service";
import {apiErrorResponse} from "@/lib/api-error";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{
 params:Promise<{groupId:string}>;
}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const {groupId}=await params;
  if(!await getLearnerGroupDetail(context,groupId))
   return NextResponse.json({error:"GROUP_NOT_FOUND"},{status:404});
  await joinOwnGroup(context,groupId);
  const group=await getLearnerGroupDetail(context,groupId);
  return NextResponse.json(group,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
