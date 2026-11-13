import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import {readBoundedJsonBody} from "@/lib/request-body";
import { acceptPublicRecruiterJoin, PublicJoinAcceptError } from "@/modules/placements/public-join/join-service";
import { route } from "@/security/route";

import { featureReady } from "@/config/features";
import { CACHE, noStoreJson } from "@/security/responses";
import { RATE_LIMITS } from "@/security/limits";
export const runtime = "nodejs";
async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  const body=await readBoundedJsonBody(request);
  if(body.kind!=="OK")return NextResponse.json({error:body.kind==="TOO_LARGE"?"REQUEST_TOO_LARGE":"COULD_NOT_JOIN"},
    {status:body.kind==="TOO_LARGE"?413:400,headers:{"Cache-Control":CACHE.NONE}});
  const trusted = featureReady("publicJoinTrustedProxy");
  const ip = trusted ? request.headers.get("x-public-verified-client-ip") : null;
  try {
    const result = await acceptPublicRecruiterJoin("COLLEGE", body.value, ip);
    return noStoreJson(result);
  } catch (error) {
    if (error instanceof PublicJoinAcceptError) {
      const unready = error.code === "NETWORK_GUARD_NOT_READY" || error.code === "NOT_CONFIGURED" || error.code === "PHONE_STORAGE_NOT_READY";
      if(error.code==="LINK_INVALID")return NextResponse.json({error:"LINK_INVALID"},
        {status:404,headers:{"Cache-Control":CACHE.NONE}});
      return NextResponse.json({
        error: error.code==="PHONE_STORAGE_NOT_READY"?"PHONE_STORAGE_NOT_READY":unready ? "SERVICE_NOT_READY" :
          error.code === "REMOVED" ? "ACCESS_REMOVED" :
          ["WRONG_CODE","CODE_EXPIRED","CODE_LOCKED","CODE_REQUIRED",
          "OTHER_COMPANY_EMAIL","COMPANY_EXISTS","COMPANY_REQUIRED","ACCOUNT_UNAVAILABLE"].includes(error.code)
            ? error.code : "COULD_NOT_JOIN",
      }, { status: unready ? 503 : error.code === "RATE_LIMITED" ? 429 : 400,
        headers: { "Cache-Control": CACHE.NONE } });
    }
    // Do not expose provider, database or account-identifying failures on this public endpoint.
    return NextResponse.json({error:"SERVICE_UNAVAILABLE"},
      {status:503,headers:{"Cache-Control":CACHE.NONE}});
  }
}
export const POST = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", rateLimit: RATE_LIMITS.BULK },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
