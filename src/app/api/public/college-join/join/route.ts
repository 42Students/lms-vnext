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
    const result = await acceptPublicRecruiterJoin("COLLEGE", await request.json(), ip);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof PublicJoinAcceptError) {
      const unready = error.code === "NETWORK_GUARD_NOT_READY" || error.code === "NOT_CONFIGURED";
      return NextResponse.json({
        error: unready ? "SERVICE_NOT_READY" :
          error.code === "REMOVED" ? "ACCESS_REMOVED" : "COULD_NOT_JOIN",
      }, { status: unready ? 503 : error.code === "RATE_LIMITED" ? 429 : 400,
        headers: { "Cache-Control": "no-store" } });
    }
    throw error;
  }
}
