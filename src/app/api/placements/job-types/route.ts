import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listPlacementJobTypeChoices} from "@/modules/placements/tpo-configuration-read-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** College members require persisted placements.read; a user with no college
 * receives only the safe built-ins, never another tenant's custom choices. */
export async function GET(){
 try{
  const context=await getCurrentRequestContext();
  const choices=await listPlacementJobTypeChoices(context,context.membership?.collegeId??null);
  return NextResponse.json({choices},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
