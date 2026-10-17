import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import {createPlacementDebarment,liftPlacementDebarment,listTpoMemberDebarments,PlacementDebarmentError} from "@/modules/placements/debarment-service";
export const runtime="nodejs";
type Context={params:Promise<{membershipId:string}>};
const input=z.discriminatedUnion("action",[
 z.object({action:z.literal("DEBAR"),reason:z.string().trim().min(1).max(500),
  untilDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  untilDrives:z.number().int().min(1).max(10000).nullable().optional()}).strict(),
 z.object({action:z.literal("LIFT"),debarmentId:z.string().uuid(),
  reason:z.string().trim().min(1).max(500)}).strict(),
]);
export async function GET(_request:Request,{params}:Context){
 try{
  const ctx=await getCurrentRequestContext(),{membershipId}=await params;
  const rows=await listTpoMemberDebarments(ctx,membershipId);
  return NextResponse.json({rows},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
export async function POST(request:Request,{params}:Context){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const ctx=await getCurrentRequestContext(),collegeId=await requireTpoBatchActor(ctx);
  const {membershipId}=await params,body=input.parse(await request.json());
  const rows=await listTpoMemberDebarments(ctx,membershipId);
  if(body.action==="LIFT"){
   const own=rows.find(row=>row.id===body.debarmentId);
   if(!own)return NextResponse.json({error:"NOT_FOUND"},{status:404});
   await liftPlacementDebarment(ctx,{debarmentId:body.debarmentId,reason:body.reason});
  }else{
   await createPlacementDebarment(ctx,{collegeId,membershipId,
    reason:body.reason,untilDate:body.untilDate??null,untilDrives:body.untilDrives??null});
  }
  return NextResponse.json({rows:await listTpoMemberDebarments(ctx,membershipId)},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){
  if(e instanceof PlacementDebarmentError&&e.code==="DB08_DEBARMENT_ALREADY_ACTIVE")
   return NextResponse.json({error:"CONFLICT"},{status:409});
  return apiErrorResponse(e);
 }
}
