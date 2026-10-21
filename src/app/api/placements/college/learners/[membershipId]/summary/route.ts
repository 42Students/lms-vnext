import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getCollegeLearnerPlacementSummary} from "@/modules/placements/college-application-detail-service";

export const runtime="nodejs";
/** Legacy learner summary across all selected-college jobs. Never resolve
 * a candidate solely by a user ID, email, or caller-provided college. */
export async function GET(_request:Request,{params}:{params:Promise<{membershipId:string}>}){
 try{
  const context=await getCurrentRequestContext();
  const {membershipId}=await params;
  const portfolio=await getCollegeLearnerPlacementSummary(context,membershipId);
  return NextResponse.json({portfolio},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
