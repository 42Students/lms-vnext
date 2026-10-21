import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getLearnerGroupDetail} from "@/modules/groups/learner-group-detail-service";
import {apiErrorResponse} from "@/lib/api-error";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{
 params:Promise<{groupId:string}>;
}){
 try{
  const context=await getCurrentRequestContext();
  const {groupId}=await params;
  const group=await getLearnerGroupDetail(context,groupId);
  if(!group)return NextResponse.json({error:"GROUP_NOT_FOUND"},{status:404});
  return NextResponse.json(group,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
