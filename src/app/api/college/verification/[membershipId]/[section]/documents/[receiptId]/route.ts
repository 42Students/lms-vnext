import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {VerificationStateError} from "@/modules/profile-verification/domain";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {openCollegeVerificationDocument} from "@/modules/verification/staff-private-document-service";
import { CACHE } from "@/security/responses";
import { zUuid } from "@/lib/schema-primitives";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const input=z.strictObject({membershipId:zUuid,section:z.enum(["EDUCATION","IDENTITY"]),receiptId:zUuid}).parse(params);
const grant=await openCollegeVerificationDocument(__ctx,input.membershipId,input.section,input.receiptId);
return NextResponse.redirect(grant.readUrl,{status:302,headers:{"Cache-Control":CACHE.PRIVATE,"Referrer-Policy":"no-referrer"}});
} catch(error){
  if(error instanceof VerificationStateError)return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(error instanceof VerificationUnavailableError)return NextResponse.json({error:error.message},{status:503});
  return apiErrorResponse(error);
 }
  },
);
