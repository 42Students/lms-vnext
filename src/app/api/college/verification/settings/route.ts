import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {profileVerificationSettings} from "@/db/schema/profile-verification";
import {requireCollegeVerificationActor,requireVerificationTables,VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {setTpoProfileVerificationEnabled} from "@/modules/profile-verification/settings-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
const inputSchema=z.strictObject({tpoCanVerify:z.boolean()});
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const context = __actor!;
    try {
const scope=await requireCollegeVerificationActor(context);
await requireVerificationTables();
const [row]=await getDb().select({enabled:profileVerificationSettings.tpoCanVerifyProfiles})
   .from(profileVerificationSettings).where(eq(profileVerificationSettings.collegeId,scope.collegeId)).limit(1);
return NextResponse.json({tpoCanVerify:row?.enabled??true},
   {headers:{"Cache-Control":CACHE.PRIVATE}});
} catch(error){
  if(error instanceof VerificationUnavailableError)return NextResponse.json({error:error.message},{status:503});
  return apiErrorResponse(error);
 }
  },
);
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const scope=await requireCollegeVerificationActor(context);
await requireVerificationTables();
const input=inputSchema.parse(await boundedRequestJson(request));
await setTpoProfileVerificationEnabled(context,scope.collegeId,input.tpoCanVerify);
return NextResponse.json({tpoCanVerify:input.tpoCanVerify},
   {headers:{"Cache-Control":CACHE.PRIVATE}});
} catch(error){
  if(error instanceof VerificationUnavailableError)return NextResponse.json({error:error.message},{status:503});
  return apiErrorResponse(error);
 }
  },
);
