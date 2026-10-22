import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {AfterCollegeError,setTpoAfterCollegeOutcome} from "@/modules/placements/tpo-after-college-write-service";
export const runtime="nodejs";
export async function PUT(request:Request,{params}:{params:Promise<{membershipId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {membershipId}=await params,raw=await request.json() as unknown;
  if(!raw||typeof raw!=="object"||Array.isArray(raw))
   return NextResponse.json({error:"INVALID_INPUT"},{status:400});
  const input=raw as Record<string,unknown>;
  const data=await setTpoAfterCollegeOutcome(await getCurrentRequestContext(),{
   learnerMembershipId:membershipId,outcome:input["outcome"],expectedVersion:input["expectedVersion"]});
  return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof AfterCollegeError)return NextResponse.json({error:error.code},{status:
   error.code==="AFTER_COLLEGE_STALE"?409:error.code==="AFTER_COLLEGE_PENDING"?503:404});
  return apiErrorResponse(error);
 }
}
