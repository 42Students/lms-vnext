import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {restorePlacementCompanyRelationship} from "@/modules/placements/company-service";
export const runtime="nodejs";
type RouteContext={params:Promise<{relationshipId:string}>};
/** COL-placements-15: restoration is a protected mutation, never GET. */
export async function POST(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const {relationshipId}=await params;
  const result=await restorePlacementCompanyRelationship(context,relationshipId);
  return NextResponse.json(result);
 }catch(error){return apiErrorResponse(error);}
}
