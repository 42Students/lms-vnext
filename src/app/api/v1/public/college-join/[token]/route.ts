import {NextResponse} from "next/server";
import {publicCollegeJoinTokenSchema} from "@/modules/placements/public-college-join-model";

export const runtime="nodejs";

/** The legacy public GET /api/v1/public/college-join/{token} now moves to
 * the college-join SSR preview. This is an on-origin navigation, not a token
 * exchange: only the destination's verified digest/expiry checks can show
 * any college information. Never cache token-bearing redirects. */
export async function GET(request:Request,{params}:{
 params:Promise<{token:string}>;
}){
 const {token}=await params;
 if(!publicCollegeJoinTokenSchema.safeParse(token).success){
  return NextResponse.json({error:"LINK_UNAVAILABLE"},{status:404,
   headers:{"Cache-Control":"private, no-store"}});
 }
 const destination=new URL("/college-join/"+encodeURIComponent(token),request.url);
 const response=NextResponse.redirect(destination,307);
 response.headers.set("Cache-Control","private, no-store");
 response.headers.set("Referrer-Policy","no-referrer");
 return response;
}
