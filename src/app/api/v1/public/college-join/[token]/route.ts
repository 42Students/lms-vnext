import {NextResponse} from "next/server";
import {publicCollegeJoinTokenSchema} from "@/modules/placements/public-college-join-model";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
import { RATE_LIMITS } from "@/security/limits";
export const runtime="nodejs";

/** The legacy public GET /api/v1/public/college-join/{token} now moves to
 * the college-join SSR preview. This is an on-origin navigation, not a token
 * exchange: only the destination's verified digest/expiry checks can show
 * any college information. Never cache token-bearing redirects. */
async function handleGET(request:Request,{params}:{
 params:Promise<{token:string}>;
}){
 const {token}=await params;
 if(!publicCollegeJoinTokenSchema.safeParse(token).success){
  return NextResponse.json({error:"LINK_UNAVAILABLE"},{status:404,
   headers:{"Cache-Control":CACHE.PRIVATE}});
 }
 const destination=new URL("/college-join/"+encodeURIComponent(token),request.url);
 const response=NextResponse.redirect(destination,307);
 response.headers.set("Cache-Control","private, no-store");
 response.headers.set("Referrer-Policy","no-referrer");
 return response;
}
export const GET = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", csrf: false, csrfExemptReason: "Links and email clients send no same-origin header; the handler validates the token or applies its own origin check.", rateLimit: RATE_LIMITS.BULK },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
