import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {profileVerificationSettings} from "@/db/schema/profile-verification";
import {requireSuperAdminVerificationCollege} from "@/modules/verification/super-admin-scope";
import {requireVerificationTables,VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {setTpoProfileVerificationEnabled} from "@/modules/profile-verification/settings-service";
const schema=z.strictObject({collegeId:z.uuid(),tpoCanVerify:z.boolean()});
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const _p=await readBoundedJsonRequest(request,8192);
    if(!_p.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const input=schema.parse(_p.value);
    await requireSuperAdminVerificationCollege(context,input.collegeId);
    await requireVerificationTables();
    await setTpoProfileVerificationEnabled(context,input.collegeId,input.tpoCanVerify);
    const [saved]=await getDb().select({enabled:profileVerificationSettings.tpoCanVerifyProfiles})
    .from(profileVerificationSettings).where(eq(profileVerificationSettings.collegeId,input.collegeId)).limit(1);
    return NextResponse.json({tpoCanVerify:saved?.enabled??input.tpoCanVerify},{headers:{"Cache-Control":"private, no-store"}});
  },
);
