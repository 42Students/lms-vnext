import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {joinGroup,leaveGroup} from "@/modules/groups/service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{groupId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  if(!hasMembershipRole(context,"LEARNER")||!context.membership)throw new AuthorizationError("academics.read");
  const {groupId}=await params;
  const id=z.uuid().parse(groupId);
  const input=z.strictObject({action:z.enum(["JOIN","LEAVE"])}).parse(await request.json());
  const membership=input.action==="JOIN"?
   await joinGroup(context,id,context.membership.id,"SELF"):
   await leaveGroup(context,id,context.membership.id,"SELF");
  return NextResponse.json({group:{id,memberState:membership.state==="REMOVED"?null:membership.state}},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
