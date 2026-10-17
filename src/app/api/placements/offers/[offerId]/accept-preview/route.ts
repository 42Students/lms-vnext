import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {previewOwnOfferAcceptanceImpact} from "@/modules/placements/offer-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** LEARNER-placements-R02: GET is read-only and only returns the learner's own impact. */
export async function GET(_request:Request,{params}:{
 params:Promise<{offerId:string}>;
}){
 try{
  const {offerId}=await params;
  const result=await previewOwnOfferAcceptanceImpact(await getCurrentRequestContext(),offerId);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store, max-age=0","Vary":"Cookie"}});
 }catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store, max-age=0");
  return response;
 }
}
