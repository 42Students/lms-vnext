import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {POST as unsubscribe} from "@/app/api/public/campaign-unsubscribe/route";

export const runtime="nodejs";
/** Compat for old LMS TpoService.unsubscribeCampaign(token). A GET never
 * mutates an email preference; only an explicit same-origin POST may do so. */
export async function POST(request:Request,{params}:{
  params:Promise<{token:string}>;
}){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  const {token}=await params;
  if(!token||token.length>2048)
    return NextResponse.json({error:"INVALID_OR_EXPIRED_LINK"},{status:400});
  const headers=new Headers();
  headers.set("content-type","application/x-www-form-urlencoded");
  headers.set("accept","application/json");
  const origin=request.headers.get("origin");
  if(origin)headers.set("origin",origin);
  const synthetic=new Request(new URL("/api/public/campaign-unsubscribe",request.url),{
    method:"POST",headers,body:new URLSearchParams({token}),
  });
  return unsubscribe(synthetic);
}
