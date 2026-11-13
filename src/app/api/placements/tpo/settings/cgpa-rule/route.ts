import { route } from "@/security/route";
import {readBoundedUtf8Body} from "@/lib/request-body";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoPlacementTeam} from "@/modules/placements/tpo-settings-people-service";
import {setCollegeCgpaConversionRule} from "@/modules/profile-verification/settings-service";
import { ROLE } from "@/modules/identity/roles";
import { noStoreJson } from "@/security/responses";
export const runtime="nodejs";
const body=z.strictObject({
 rule:z.enum(["X9_5","MINUS_0_5_X10","MINUS_0_75_X10","X10"]),
});
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    const decoded=await readBoundedUtf8Body(request,1000);
    if(decoded.kind!=="OK")
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    if(!context.membership)
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
    const team=await getTpoPlacementTeam(context,context.membership.collegeId);
    const member=team.members.find(row=>row.membershipId===context.membership?.id);
    if(!member?.roles.includes("TPO_ADMIN")&&!member?.roles.includes(ROLE.COLLEGE_ADMIN))
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
    const rule=body.parse(JSON.parse(decoded.body)).rule;
    const result=await setCollegeCgpaConversionRule(context,context.membership.collegeId,rule);
    return noStoreJson(result);
  },
);
