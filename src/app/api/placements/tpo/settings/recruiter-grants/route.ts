import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readTpoSettingsBody,TpoCommunicationBodyError} from "@/modules/placements/tpo-communication-request-model";
import { changeTpoRecruiterGrant } from "@/modules/placements/tpo-recruiter-grant-write-service";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    return NextResponse.json(await changeTpoRecruiterGrant(context, await readTpoSettingsBody(request)));
  } catch (error) {
    if(error instanceof TpoCommunicationBodyError)return NextResponse.json({error:"INVALID_REQUEST"},{
      status:error.code==="BODY_TOO_LARGE"?413:400,headers:{"Cache-Control":"private, no-store"},
    });
    return apiErrorResponse(error);
  }
}
