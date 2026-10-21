import {NextResponse} from "next/server";
import {DELETE as revokeCurrentSession} from "@/app/api/auth/session/route";

export const runtime="nodejs";

/** Legacy POST /api/v1/auth/logout adapter. No Bearer refresh-token
 * translation: current devices use revocable opaque first-party sessions.
 * The shared handler retains same-origin enforcement, explicit cookie
 * clearing, failure status, and the original "Logged out" success message.
 */
export async function POST(request:Request){
 // A legacy Bearer token is not a revocable vNext opaque cookie. Do not claim
 // it was blocklisted or silently bridge authorization across auth systems.
 if(/^Bearer\s+/i.test(request.headers.get("authorization")??"")){
  return NextResponse.json({
   error:"LEGACY_BEARER_LOGOUT_UNSUPPORTED",
   message:"This old login method is no longer supported. Please sign in again with a fresh one-time code.",
  },{status:410,headers:{"Cache-Control":"no-store"}});
 }
 return revokeCurrentSession(request);
}
