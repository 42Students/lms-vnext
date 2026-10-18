import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import { acceptPublicRecruiterJoin, PublicJoinAcceptError } from "@/modules/placements/public-join/join-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  const trusted = process.env.PUBLIC_JOIN_TRUSTED_PROXY_READY === "VERIFIED";
  const ip = trusted ? request.headers.get("x-public-verified-client-ip") : null;
  try {
    const result = await acceptPublicRecruiterJoin("COMPANY", await request.json().catch(() => null), ip);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof PublicJoinAcceptError) {
      const unready = error.code === "NETWORK_GUARD_NOT_READY" || error.code === "NOT_CONFIGURED" || error.code === "PHONE_STORAGE_NOT_READY";
      return NextResponse.json({
        error: error.code==="PHONE_STORAGE_NOT_READY"?"PHONE_STORAGE_NOT_READY":unready ? "SERVICE_NOT_READY" :
          error.code === "REMOVED" ? "ACCESS_REMOVED" :
          ["WRONG_CODE","CODE_EXPIRED","CODE_LOCKED","CODE_REQUIRED",
          "OTHER_COMPANY_EMAIL","COMPANY_EXISTS","ACCOUNT_UNAVAILABLE"].includes(error.code)
            ? error.code : "COULD_NOT_JOIN",
      }, { status: unready ? 503 : error.code === "RATE_LIMITED" ? 429 : 400,
        headers: { "Cache-Control": "no-store" } });
    }
    // Do not expose provider, database or account-identifying failures on this public endpoint.
    return NextResponse.json({error:"SERVICE_UNAVAILABLE"},
      {status:503,headers:{"Cache-Control":"no-store"}});
  }
}
