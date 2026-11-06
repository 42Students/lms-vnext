import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {VerificationStateError} from "@/modules/profile-verification/domain";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {getCollegeVerificationDetail} from "@/modules/verification/staff-review-detail-service";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const raw=params;
    const input=z.strictObject({membershipId:z.string().uuid(),section:z.enum(["EDUCATION","IDENTITY"])}).parse(raw);
    const review=await getCollegeVerificationDetail(__ctx,input.membershipId,input.section);
    return NextResponse.json({review},{headers:{"Cache-Control":"private, no-store"}});
  },
);
