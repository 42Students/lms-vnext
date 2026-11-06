import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {reviewCollegeVerificationBulk} from "@/modules/verification/staff-bulk-review-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const result=await reviewCollegeVerificationBulk(context,await request.json());
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
