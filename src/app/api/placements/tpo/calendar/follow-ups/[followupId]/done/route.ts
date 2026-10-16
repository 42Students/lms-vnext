import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {tpoCrmApiErrorResponse} from "@/lib/tpo-crm-api-error";
import {tpoCrmTablesReady} from "@/modules/placements/tpo-crm-storage-readiness";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {finishTpoFollowup} from "@/modules/placements/tpo-crm-service";
import {tpoCrmFollowupIdSchema} from "@/modules/placements/tpo-crm-validation";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{followupId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 if(!await tpoCrmTablesReady())return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503});
 try{
  const context=await getCurrentRequestContext();
  if(!context.membership||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
  const collegeId=context.membership.collegeId;
  await requirePlacementManageScope(context,collegeId);
  const {followupId:rawId}=await params;
  const id=tpoCrmFollowupIdSchema.parse(rawId);
  const done=await finishTpoFollowup(context,collegeId,id);
  return NextResponse.json({id:done.id,status:"DONE"},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return tpoCrmApiErrorResponse(error);}
}
