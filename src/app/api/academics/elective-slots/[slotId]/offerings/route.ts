import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {listCollegeOfferingChoices} from "@/modules/electives/college-offering-choices-service";
import {createElectiveOffering} from "@/modules/electives/service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const {slotId}=params;
    const choices=await listCollegeOfferingChoices(context,slotId);
    return privateJson(choices);
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {slotId}=params;
    const {courseId,groupId,backedDeliveryId,capacity}=await boundedRequestJson(request);
    const offering=await createElectiveOffering(context,{slotId,courseId,groupId:groupId||undefined,backedDeliveryId,capacity});
    return NextResponse.json({offering},{status:201});
  },
);
