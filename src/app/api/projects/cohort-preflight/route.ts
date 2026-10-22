import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getCohortCreationPreflight} from "@/modules/projects/cohort-preflight-service";
export const runtime="nodejs";

function resultEnvelope(result:Awaited<ReturnType<typeof getCohortCreationPreflight>>){
 return {...result,createdCount:0,unchangedCount:result.alreadyCovered,
  failedCount:0,partialFailure:false,noEligible:result.toCreate===0,
  committed:false,action:"PREFLIGHT" as const,
  nextAction:result.toCreate>0?"REVIEW_AND_CONFIRM_BULK":"REVIEW_CLASS_OR_TEMPLATE",
  commitHref:"/api/projects/class-team-workspaces"};
}
/** The old API accepted POST for preflight. Preserve POST and legacy client
 * response flags while GET remains available to current vNext forms.
 * This is always read-only: actual creation uses its independent POST route. */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const raw:unknown=await request.json();
  const result=await getCohortCreationPreflight(await getCurrentRequestContext(),raw);
  return NextResponse.json(resultEnvelope(result),{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const result=await getCohortCreationPreflight(await getCurrentRequestContext(),{
   collegeId:params.get("collegeId"),classId:params.get("classId"),templateId:params.get("templateId"),
  });
  return NextResponse.json(resultEnvelope(result),{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
