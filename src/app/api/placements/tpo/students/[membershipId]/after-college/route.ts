import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {AfterCollegeError,setTpoAfterCollegeOutcome} from "@/modules/placements/tpo-after-college-write-service";
export const runtime="nodejs";
export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {membershipId}=params,raw=await boundedRequestJson(request) as unknown;
if(!raw||typeof raw!=="object"||Array.isArray(raw))
   return NextResponse.json({error:"INVALID_INPUT"},{status:400});
const input=raw as Record<string,unknown>;
const data=await setTpoAfterCollegeOutcome(__ctx,{
   learnerMembershipId:membershipId,outcome:input["outcome"],
   outcomeLabel:input["outcomeLabel"],outcomeDetail:input["outcomeDetail"],
   expectedVersion:input["expectedVersion"]});
return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
} catch(error){
  if(error instanceof AfterCollegeError)return NextResponse.json({error:error.code},{status:
   error.code==="AFTER_COLLEGE_STALE"?409:error.code==="AFTER_COLLEGE_INVALID_LABEL"?400:
   error.code==="AFTER_COLLEGE_PENDING"?503:404});
  return apiErrorResponse(error);
 }
  },
);
