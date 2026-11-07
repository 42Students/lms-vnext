import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readTpoSettingsBody,TpoCommunicationBodyError} from "@/modules/placements/tpo-communication-request-model";
import {
  changeTpoPublicJoinLink, TpoPublicJoinLinkError,
} from "@/modules/placements/tpo-public-join-link-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
const body = await readTpoSettingsBody(request);
const result = await changeTpoPublicJoinLink(__ctx, body);
return NextResponse.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
} catch (error) {
    if(error instanceof TpoCommunicationBodyError)return NextResponse.json({error:"INVALID_BODY"},{
      status:error.code==="BODY_TOO_LARGE"?413:400,headers:{"Cache-Control":"private, no-store"},
    });
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
    }
    if (error instanceof TpoPublicJoinLinkError) {
      return NextResponse.json({ error: error.code }, {
        status: error.code === "NOT_REGISTERED" ? 503 :
          error.code === "DOMAIN_REQUIRED" ? 422 :
          error.code === "NOT_FOUND" ? 404 : 409,
      });
    }
    return apiErrorResponse(error);
  }
  },
);
