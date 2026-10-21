import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {legacyShareBody,legacyShareCode,legacyShareCookie,legacyShareInvalid,
 legacyShareVerify,legacyShareHeaders} from "@/modules/placements/company-share/legacy-public-controller";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{token:string}>}){
 if(!isSameOriginRequest(request))return legacyShareInvalid();
 const {token}=await params,access=await legacyShareVerify(token,
  legacyShareCode(await legacyShareBody(request)));
 if(!access)return legacyShareInvalid();
 // The existing export route performs a second code-bound proof check,
 // restricts resumés to CLEAN scanned private objects and audits the read.
 // 303 converts the legacy POST into that guarded GET without URL credentials.
 const url=new URL("/api/placements/company-share/"+
  encodeURIComponent(token)+"/export?format=zip",request.url);
 return legacyShareCookie(NextResponse.redirect(url,303),access);
}
