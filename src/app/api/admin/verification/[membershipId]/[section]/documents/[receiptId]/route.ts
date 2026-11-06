import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {VerificationStateError} from "@/modules/profile-verification/domain";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {openCollegeVerificationDocument} from "@/modules/verification/staff-private-document-service";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {membershipId,section,receiptId}=z.strictObject({
   membershipId:z.uuid(),section:z.enum(["EDUCATION","IDENTITY"]),receiptId:z.uuid(),
  }).parse(params);
    const collegeId=z.uuid().parse(new URL(request.url).searchParams.get("collegeId"));
    const grant=await openCollegeVerificationDocument(
   __ctx,membershipId,section,receiptId,collegeId);
    return NextResponse.redirect(grant.readUrl,{status:302,headers:{
   "Cache-Control":"private, no-store","Referrer-Policy":"no-referrer",
  }});
  },
);
