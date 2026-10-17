import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import { requestPublicJoinCode, PublicJoinCodeError } from "@/modules/placements/public-join/send-code-service";
import { deliverPublicRecruiterJoinCode } from "@/modules/messaging/public-join-code-delivery";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  const input = await request.json().catch(() => null);
  // A trusted ingress must overwrite this header. Without explicit proxy
  // attestation this public endpoint fails closed (never rate-limit by spoofed IP).
  const trusted = process.env.PUBLIC_JOIN_TRUSTED_PROXY_READY === "VERIFIED";
  const network = trusted ? request.headers.get("x-public-verified-client-ip") : null;
  try {
    await requestPublicJoinCode("COLLEGE", input, network, deliverPublicRecruiterJoinCode);
    return NextResponse.json({ sent: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof PublicJoinCodeError) {
      const unavailable = error.code === "NETWORK_GUARD_NOT_READY";
      const limited = error.code === "RATE_LIMITED";
      const noMx=error.code==="EMAIL_NO_MX";
      const dnsUnavailable=error.code==="EMAIL_MX_UNAVAILABLE";
      return NextResponse.json({ error: unavailable ? "SERVICE_NOT_READY" : limited ? "TOO_MANY_CODES" : noMx?"EMAIL_NO_MX":dnsUnavailable?"EMAIL_MX_UNAVAILABLE":"COULD_NOT_SEND_CODE" },
        { status: unavailable||dnsUnavailable ? 503 : limited ? 429 : 400, headers: { "Cache-Control": "no-store" } });
    }
    throw error;
  }
}
