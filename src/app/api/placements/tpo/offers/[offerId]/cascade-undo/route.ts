import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {undoPlacementOfferCascade} from "@/modules/placements/offer-cascade-undo-service";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
export const runtime="nodejs";
const body=z.object({cascadeId:z.string().uuid(),confirmed:z.literal(true)}).strict();
/** P-S1-06: no GET mutation, no client-supplied actor or tenant scope. */
export async function POST(request:Request,{params}:{
 params:Promise<{offerId:string}>
}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const input=body.safeParse(await readTpoBulkRequestBody(request));
  if(!input.success)return NextResponse.json({error:"Invalid undo confirmation."},
    {status:400,headers:{"Cache-Control":"private, no-store"}});
  const {offerId}=await params;
  const ctx=await getCurrentRequestContext();
  const result=await undoPlacementOfferCascade(ctx,offerId,input.data.cascadeId);
  // Offer cascade compensation and applicant-move undo have different safety
  // windows. Do not imply that this endpoint reverses a notified applicant move.
  return NextResponse.json({...result,undoType:"OFFER_CASCADE"},{
   headers:{"Cache-Control":"private, no-store"},
  });
 }catch(err){
  if(err instanceof TpoBulkBodyError)return NextResponse.json({error:err.message},{
    status:err.status,headers:{"Cache-Control":"private, no-store"},
  });
  if(err instanceof AuthorizationError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(err instanceof z.ZodError)return NextResponse.json({error:"INVALID_BODY"},{status:400});
  if(err instanceof PlacementsServiceError){
   const missing=err.code==="PLACEMENT_OFFER_NOT_FOUND";
   return NextResponse.json({
    error:missing?"NOT_FOUND":"OFFER_CASCADE_NO_LONGER_UNDOABLE",
    message:missing?"Offer not found.":"This offer cascade can no longer be undone after dependent application, offer or joining records have changed.",
    undoType:"OFFER_CASCADE",
   },{status:missing?404:409,headers:{"Cache-Control":"private, no-store"}});
  }
  throw err;
 }
}
