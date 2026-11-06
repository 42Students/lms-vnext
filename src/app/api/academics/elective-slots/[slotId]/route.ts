import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { CollegeElectiveSlotMutationError, updateCollegeElectiveSlot } from "@/modules/electives/college-slot-mutation-service";
import { getSuperAdminElectiveSlotDetail } from "@/modules/electives/admin-directory-service";

export const runtime = "nodejs";

/** Old GET admin/slots/{id}: full selected-slot panel for an explicitly
 * acting-college-scoped global administrator; College Admin continues through
 * /offerings, retaining its membership-checked choices and mutations.
 */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const {slotId}=params;
    const detail=await getSuperAdminElectiveSlotDetail(context,slotId);
    if(!detail)return NextResponse.json({error:"ELECTIVE_SLOT_NOT_FOUND"},{status:404});
    return NextResponse.json({status:"OK",data:detail,...detail},
      {headers:{"Cache-Control":"private, no-store"}});
  },
);


export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { slotId } = params;
    const body: unknown = await request.json();
    const result = await updateCollegeElectiveSlot(context, slotId, body);
    return NextResponse.json({ slot: result });
  },
);
