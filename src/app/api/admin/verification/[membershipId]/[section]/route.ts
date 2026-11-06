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
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {membershipId,section}=z.strictObject({
   membershipId:z.uuid(),section:z.enum(["EDUCATION","IDENTITY"]),
  }).parse(params);
const collegeId=z.uuid().parse(new URL(request.url).searchParams.get("collegeId"));
const review=await getCollegeVerificationDetail(
   __ctx,membershipId,section,collegeId);
return NextResponse.json({review},{headers:{"Cache-Control":"private, no-store"}});
} catch(error){
  if(error instanceof VerificationStateError)return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(error instanceof VerificationUnavailableError)return NextResponse.json({error:error.message},{status:503});
  return apiErrorResponse(error);
 }
  },
);
