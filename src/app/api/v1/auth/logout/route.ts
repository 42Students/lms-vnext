import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {DELETE as revokeCurrentSession} from "@/app/api/auth/session/route";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
export const runtime="nodejs";

/** Legacy POST /api/v1/auth/logout adapter. No Bearer refresh-token
 * translation: current devices use revocable opaque first-party sessions.
 * The shared handler retains same-origin enforcement, explicit cookie
 * clearing, failure status, and the original "Logged out" success message.
 */
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 // A legacy Bearer token is not a revocable vNext opaque cookie. Do not claim
 // it was blocklisted or silently bridge authorization across auth systems.
 if(/^Bearer\s+/i.test(request.headers.get("authorization")??"")){
  return NextResponse.json({
   error:"LEGACY_BEARER_LOGOUT_UNSUPPORTED",
   message:"This old login method is no longer supported. Please sign in again with a fresh one-time code.",
  },{status:410,headers:{"Cache-Control":CACHE.NONE}});
 }
 return revokeCurrentSession(request);
}
export const POST = route(
  { auth: "public", publicReason: "Sign-in, recovery and session endpoints run before or independently of a session; each handler enforces its own challenge, device or session-state checks.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
