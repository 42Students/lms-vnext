import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readTpoSettingsBody,TpoCommunicationBodyError} from "@/modules/placements/tpo-communication-request-model";
import { changeTpoRecruiterGrant,TpoRecruiterGrantConflict } from "@/modules/placements/tpo-recruiter-grant-write-service";
export const runtime = "nodejs";
/** Legacy /api/v1/tpo/recruiter-access/{recruiterId}/extend|revoke maps
 * to action EXTEND|REVOKE with the UUID grantId and expectedUpdatedAt.
 * The discriminated-union validator rejects obsolete integer recruiter IDs;
 * tenant-scoped permission and compare-and-swap are enforced in the service.
 * A recruiter leaving their own college instead uses the separate self-leave DELETE.
 */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    return NextResponse.json(await changeTpoRecruiterGrant(context, await readTpoSettingsBody(request)));
  } catch (error) {
    if(error instanceof TpoCommunicationBodyError)return NextResponse.json({error:"INVALID_REQUEST"},{
      status:error.code==="BODY_TOO_LARGE"?413:400,headers:{"Cache-Control":"private, no-store"},
    });
    if(error instanceof TpoRecruiterGrantConflict)return NextResponse.json({
      error:error.detail==="REVOKED"?"RECRUITER_GRANT_REVOKED":"TPO_RECRUITER_GRANT_STALE_OR_INVALID",
      message:error.detail==="REVOKED"?
        "This recruiter\u0027s access was revoked; invite them again instead":
        "Recruiter access changed. Refresh and try again.",
    },{status:409,headers:{"Cache-Control":"private, no-store"}});
    return apiErrorResponse(error);
  }
}
