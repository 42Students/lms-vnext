import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {reopenApprovedProjectDelivery} from "@/modules/projects/delivery-reopen-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {projectId,submissionId}=params;
    const result=await reopenApprovedProjectDelivery(context,projectId,submissionId,await boundedRequestJson(request));
    return NextResponse.json(result);
  },
);
