import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {requestOwnInterviewWithdrawal} from "@/modules/placements/learner-interview-withdrawal-service";
export const POST = route(
  { auth: "user", permission: "placements.read" },
  async ({ request, context: actor }) => {
    const context = actor!;
    return NextResponse.json({request:await requestOwnInterviewWithdrawal(context,await boundedRequestJson(request))},{status:201});
  },
);
