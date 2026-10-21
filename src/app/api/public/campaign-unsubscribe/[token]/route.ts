import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {POST as confirmUnsubscribe} from "../route";
export const runtime="nodejs";
/**
 * Compatibility with the legacy path-token POST client. Never accept an
 * unverified token as a successful unsubscribe, even if already expired.
 * Both API shapes use the same bounded, signed-token and durable write path.
 */
export async function POST(request:Request,{params}:{
 params:Promise<{token:string}>;
}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {token}=await params;
 if(typeof token!=="string"||token.length===0||token.length>2048)
  return NextResponse.json({error:"INVALID_OR_EXPIRED_LINK"},{status:400,headers:{"Cache-Control":"no-store"}});
 const headers=new Headers({"content-type":"application/x-www-form-urlencoded","accept":"application/json"});
 const origin=request.headers.get("origin"),referer=request.headers.get("referer");
 if(origin)headers.set("origin",origin);
 if(referer)headers.set("referer",referer);
 const forwarded=new Request(new URL("/api/public/campaign-unsubscribe",request.url),{
  method:"POST",headers,body:new URLSearchParams({token}).toString(),
 });
 return confirmUnsubscribe(forwarded);
}
