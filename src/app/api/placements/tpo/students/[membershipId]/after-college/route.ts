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
    const {membershipId}=params,raw=await request.json() as unknown;
    if(!raw||typeof raw!=="object"||Array.isArray(raw))
   return NextResponse.json({error:"INVALID_INPUT"},{status:400});
    const input=raw as Record<string,unknown>;
    const data=await setTpoAfterCollegeOutcome(__ctx,{
   learnerMembershipId:membershipId,outcome:input["outcome"],
   outcomeLabel:input["outcomeLabel"],outcomeDetail:input["outcomeDetail"],
   expectedVersion:input["expectedVersion"]});
    return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
  },
);
