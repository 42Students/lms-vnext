import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import {readBoundedJsonBody} from "@/lib/request-body";
import { requestPublicJoinCode, PublicJoinCodeError } from "@/modules/placements/public-join/send-code-service";
import { deliverPublicRecruiterJoinCode } from "@/modules/messaging/public-join-code-delivery";
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
  if(body.kind!=="OK")return NextResponse.json({error:body.kind==="TOO_LARGE"?"REQUEST_TOO_LARGE":"COULD_NOT_SEND_CODE"},
    {status:body.kind==="TOO_LARGE"?413:400,headers:{"Cache-Control":CACHE.NONE}});
  const input=body.value;
  // A trusted ingress must overwrite this header. Without explicit proxy
  // attestation this public endpoint fails closed (never rate-limit by spoofed IP).
  const trusted = featureReady("publicJoinTrustedProxy");
  const network = trusted ? request.headers.get("x-public-verified-client-ip") : null;
  try {
    const result=await requestPublicJoinCode("COLLEGE", input, network, deliverPublicRecruiterJoinCode);
    return noStoreJson({ sent: true,companyName:result.companyName });
  } catch (error) {
    if (error instanceof PublicJoinCodeError) {
      const unavailable = error.code === "NETWORK_GUARD_NOT_READY";
      const limited = error.code === "RATE_LIMITED";
      const noMx=error.code==="EMAIL_NO_MX";
      const dnsUnavailable=error.code==="EMAIL_MX_UNAVAILABLE";
      return NextResponse.json({ error: unavailable ? "SERVICE_NOT_READY" : limited ? "TOO_MANY_CODES" : noMx?"EMAIL_NO_MX":dnsUnavailable?"EMAIL_MX_UNAVAILABLE":"COULD_NOT_SEND_CODE" },
        { status: unavailable||dnsUnavailable ? 503 : limited ? 429 : 400, headers: { "Cache-Control": CACHE.NONE } });
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
