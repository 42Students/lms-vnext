import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/request-body";
import {profileVerificationSettings} from "@/db/schema/profile-verification";
import {requireSuperAdminVerificationCollege} from "@/modules/verification/super-admin-scope";
import {requireVerificationTables,VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {setTpoProfileVerificationEnabled} from "@/modules/profile-verification/settings-service";
import { privateJson } from "@/security/responses";
import { zUuid } from "@/lib/schema-primitives";
const schema=z.strictObject({collegeId:zUuid,tpoCanVerify:z.boolean()});
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const _p=await readBoundedJsonRequest(request,8192);
if(!_p.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
const input=schema.parse(_p.value);
await requireSuperAdminVerificationCollege(context,input.collegeId);
await requireVerificationTables();
await setTpoProfileVerificationEnabled(context,input.collegeId,input.tpoCanVerify);
const [saved]=await getDb().select({enabled:profileVerificationSettings.tpoCanVerifyProfiles})
    .from(profileVerificationSettings).where(eq(profileVerificationSettings.collegeId,input.collegeId)).limit(1);
return privateJson({tpoCanVerify:saved?.enabled??input.tpoCanVerify});
} catch(error){
  if(error instanceof VerificationUnavailableError)return NextResponse.json({error:"VERIFICATION_STORAGE_PENDING"},{status:503});
  return apiErrorResponse(error);
 }
  },
);
