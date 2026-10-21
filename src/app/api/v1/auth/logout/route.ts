import {DELETE as revokeCurrentSession} from "@/app/api/auth/session/route";

export const runtime="nodejs";

/** Legacy POST /api/v1/auth/logout adapter. No Bearer refresh-token
 * translation: current devices use revocable opaque first-party sessions.
 * The shared handler retains same-origin enforcement, explicit cookie
 * clearing, failure status, and the original "Logged out" success message.
 */
export async function POST(request:Request){
 return revokeCurrentSession(request);
}
