import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getCurrentTpoPlacementSeason} from "@/modules/placements/tpo-season-current-service";
export const runtime="nodejs";
/** Selected TPO membership supplies college identity; no untrusted college ID
 * or numeric legacy season ID is accepted at the public read boundary.
 */
export async function GET(){
 try{
  const state=await getCurrentTpoPlacementSeason(await getCurrentRequestContext());
  return NextResponse.json(state,{headers:{"cache-control":"no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
