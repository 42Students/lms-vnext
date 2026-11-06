import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {verificationReviewInput} from "@/modules/verification/review-input";
import {requireCollegeVerificationActor,requireVerificationTables,VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {VerificationStateError} from "@/modules/profile-verification/domain";
import {reviewProfileVerification} from "@/modules/profile-verification/service";
import {createProfileVerificationRepository} from "@/modules/profile-verification/repository";
import {verifyPrivateDocumentReceipt} from "@/modules/profile-verification/private-receipts";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    await requireCollegeVerificationActor(context);
    await requireVerificationTables();
    const input=verificationReviewInput.parse(await request.json());
    const record=await reviewProfileVerification(context,input,
   createProfileVerificationRepository(verifyPrivateDocumentReceipt));
    const sectionLabel=record.section==="EDUCATION"?"Education":"Identity";
    const message=input.action==="VERIFY"?sectionLabel+" verified":
   record.status==="VERIFIED"
    ?sectionLabel+" update sent back. The previous verified snapshot remains in effect."
    :sectionLabel+" sent back for changes";
    return NextResponse.json({decision:{learnerMembershipId:record.learnerMembershipId,
   section:record.section,status:record.status,version:record.version},message},
   {headers:{"Cache-Control":"private, no-store"}});
  },
);
