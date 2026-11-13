import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {POST as confirmUnsubscribe} from "../route";
import { route } from "@/security/route";
import { noStoreJson } from "@/security/responses";
export const runtime="nodejs";
/**
 * Compatibility with the legacy path-token POST client. Never accept an
 * unverified token as a successful unsubscribe, even if already expired.
 * Both API shapes use the same bounded, signed-token and durable write path.
 */
async function handlePOST(request:Request,{params}:{
 params:Promise<{token:string}>;
}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {token}=await params;
 if(typeof token!=="string"||token.length===0||token.length>2048)
  return noStoreJson({error:"INVALID_OR_EXPIRED_LINK"}, { status: 400 });
 const headers=new Headers({"content-type":"application/x-www-form-urlencoded","accept":"application/json"});
 // Delegation must retain the verified Host. The same-origin write guard
 // intentionally rejects synthetic requests without that header.
 const origin=request.headers.get("origin"),referer=request.headers.get("referer");
 const host=request.headers.get("host");
 if(origin)headers.set("origin",origin);
 if(referer)headers.set("referer",referer);
 if(host)headers.set("host",host);
 const forwarded=new Request(new URL("/api/public/campaign-unsubscribe",request.url),{
  method:"POST",headers,body:new URLSearchParams({token}).toString(),
 });
 return confirmUnsubscribe(forwarded);
}
export const POST = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
