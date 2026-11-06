import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {requestOwnInterviewWithdrawal} from "@/modules/placements/learner-interview-withdrawal-service";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    return NextResponse.json({request:await requestOwnInterviewWithdrawal(context,await request.json())},{status:201});
  },
);
