import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getDb} from "@/db/client";
import {and,eq} from "drizzle-orm";
import {learnerProgramEnrollments} from "@/db/schema";
import {TpoGeneralRequestError,createOwnTpoGeneralRequest,listOwnTpoGeneralRequests} from "@/modules/placements/tpo-general-request-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{
  const ctx=await getCurrentRequestContext();
  const requests=await listOwnTpoGeneralRequests(ctx);
  const memberships=ctx.membership?await getDb().select({cohortId:learnerProgramEnrollments.cohortId}).from(learnerProgramEnrollments)
   .where(and(eq(learnerProgramEnrollments.membershipId,ctx.membership.id),eq(learnerProgramEnrollments.status,"ACTIVE"))).limit(2):[];
  return NextResponse.json({requests,cohortId:memberships.length===1?memberships[0].cohortId:null},
  {headers:{"Cache-Control":"private, no-store"}});}
 catch(error){
  if(error instanceof TpoGeneralRequestError&&error.code==="UNAVAILABLE")
   return NextResponse.json({error:"REQUESTS_NOT_READY"},{status:503});
  return apiErrorResponse(error);
 }
}
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const result=await createOwnTpoGeneralRequest(await getCurrentRequestContext(),await request.json());
  return NextResponse.json(result,{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TpoGeneralRequestError)return NextResponse.json({error:error.code},
   {status:error.code==="UNAVAILABLE"?503:error.code==="TARGET_CHANGED"?409:403});
  return apiErrorResponse(error);
 }
}
