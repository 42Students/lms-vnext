import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {VerificationStateError} from "@/modules/profile-verification/domain";
import {reviewProfileVerification} from "@/modules/profile-verification/service";
import {createProfileVerificationRepository} from "@/modules/profile-verification/repository";
import {verifyPrivateDocumentReceipt} from "@/modules/profile-verification/private-receipts";
import {verificationReviewInput} from "@/modules/verification/review-input";
import {requireSuperAdminVerificationCollege} from "@/modules/verification/super-admin-scope";
import {requireVerificationTables,VerificationUnavailableError} from "@/modules/verification/staff-auth";

export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const _p=await readBoundedJsonRequest(request,8192);
    if(!_p.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const body=_p.value;
    const candidate=z.object({collegeId:z.uuid()}).parse(body);
    await requireSuperAdminVerificationCollege(context,candidate.collegeId);
    await requireVerificationTables();
    const reviewBody={...z.record(z.string(),z.unknown()).parse(body)};
    delete reviewBody.collegeId;
    const input=verificationReviewInput.parse(reviewBody);
    const record=await reviewProfileVerification(context,input,
   createProfileVerificationRepository(verifyPrivateDocumentReceipt));
    return NextResponse.json({decision:{
   learnerMembershipId:record.learnerMembershipId,section:record.section,
   status:record.status,version:record.version,
  }},{headers:{"Cache-Control":"private, no-store"}});
  },
);
