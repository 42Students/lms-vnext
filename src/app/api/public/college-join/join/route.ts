import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import {readBoundedJsonBody} from "@/lib/bounded-json-body";
import { acceptPublicRecruiterJoin, PublicJoinAcceptError } from "@/modules/placements/public-join/join-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  const body=await readBoundedJsonBody(request);
  if(body.kind!=="OK")return NextResponse.json({error:body.kind==="TOO_LARGE"?"REQUEST_TOO_LARGE":"COULD_NOT_JOIN"},
    {status:body.kind==="TOO_LARGE"?413:400,headers:{"Cache-Control":"no-store"}});
  const trusted = process.env.PUBLIC_JOIN_TRUSTED_PROXY_READY === "VERIFIED";
  const ip = trusted ? request.headers.get("x-public-verified-client-ip") : null;
  try {
    const result = await acceptPublicRecruiterJoin("COLLEGE", body.value, ip);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof PublicJoinAcceptError) {
      const unready = error.code === "NETWORK_GUARD_NOT_READY" || error.code === "NOT_CONFIGURED" || error.code === "PHONE_STORAGE_NOT_READY";
      if(error.code==="LINK_INVALID")return NextResponse.json({error:"LINK_INVALID"},
        {status:404,headers:{"Cache-Control":"no-store"}});
      return NextResponse.json({
        error: error.code==="PHONE_STORAGE_NOT_READY"?"PHONE_STORAGE_NOT_READY":unready ? "SERVICE_NOT_READY" :
          error.code === "REMOVED" ? "ACCESS_REMOVED" :
          ["WRONG_CODE","CODE_EXPIRED","CODE_LOCKED","CODE_REQUIRED",
          "OTHER_COMPANY_EMAIL","COMPANY_EXISTS","COMPANY_REQUIRED","ACCOUNT_UNAVAILABLE"].includes(error.code)
            ? error.code : "COULD_NOT_JOIN",
      }, { status: unready ? 503 : error.code === "RATE_LIMITED" ? 429 : 400,
        headers: { "Cache-Control": "no-store" } });
    }
    // Do not expose provider, database or account-identifying failures on this public endpoint.
    return NextResponse.json({error:"SERVICE_UNAVAILABLE"},
      {status:503,headers:{"Cache-Control":"no-store"}});
  }
}
