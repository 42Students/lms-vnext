import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {VerificationStateError} from "@/modules/profile-verification/domain";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {getCollegeVerificationDetail} from "@/modules/verification/staff-review-detail-service";
import {requireTpoVerificationActor} from "@/modules/verification/tpo-staff-auth";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const context = __actor!;
    try {
const raw=params;
const input=z.strictObject({membershipId:z.string().uuid(),section:z.enum(["EDUCATION","IDENTITY"])}).parse(raw);
await requireTpoVerificationActor(context);
const review=await getCollegeVerificationDetail(context,input.membershipId,input.section,undefined,true);
return privateJson({review});
} catch(error){
  if(error instanceof VerificationStateError)return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(error instanceof VerificationUnavailableError)return NextResponse.json({error:error.message},{status:503});
  return apiErrorResponse(error);
 }
  },
);
