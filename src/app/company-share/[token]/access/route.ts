import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";
import {verifyPublicCompanyShareCode} from "@/modules/placements/company-share/access-service";
import {companyShareTokenSchema} from "@/modules/placements/company-share/token-model";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** The browser submits a six-character code; never let an anonymous caller
 * buffer an unbounded multipart/urlencoded request before verification.
 * Preserve native form compatibility within the 2 KiB byte budget.
 */
const MAX_SHARE_CODE_FORM_BYTES=2048;
const privateHeaders={"Cache-Control":CACHE.PRIVATE,"Referrer-Policy":"no-referrer"};
function rejected(status:number) {
 return NextResponse.json({error:"INVALID_REQUEST"},{status,headers:privateHeaders});
}

export async function POST(request:Request,{params}:{params:Promise<{token:string}>}){
 if(!isSameOriginRequest(request))return rejected(403);
 const {token}=await params;
 if(!companyShareTokenSchema.safeParse(token).success)
  return new Response(null,{status:404,headers:privateHeaders});
 const raw=await readBoundedUtf8Body(request,MAX_SHARE_CODE_FORM_BYTES);
 if(raw.kind==="TOO_LARGE")return rejected(413);
 if(raw.kind!=="OK")return rejected(400);
 const contentType=request.headers.get("content-type")??"";
 // A normal browser form uses x-www-form-urlencoded. Multipart is supported
 // for legacy clients but must also fit in the same tiny byte budget.
 if(!/^application\/x-www-form-urlencoded(?:\s*;|\s*$)/i.test(contentType) &&
    !/^multipart\/form-data\s*;\s*boundary=/i.test(contentType))
  return rejected(415);
 const boundedRequest=new Request(request.url,{method:"POST",body:raw.body,
  headers:{"content-type":contentType}});
 const form=await boundedRequest.formData().catch(()=>null);
 // Repeated code fields must not select a preferred value silently.
 const values=form?.getAll("code")??[];
 const code=values.length===1&&typeof values[0]==="string"?values[0]:null;
 const outcome=code===null?{kind:"DENIED" as const}:
  await verifyPublicCompanyShareCode(token,code);
 const redirect=new URL("/company-share/"+encodeURIComponent(token),request.url);
 if(outcome.kind!=="VERIFIED")redirect.searchParams.set("access","invalid");
 const response=NextResponse.redirect(redirect,303);
 response.headers.set("Cache-Control","private, no-store");
 response.headers.set("Referrer-Policy","no-referrer");
 if(outcome.kind==="VERIFIED")response.cookies.set("company_share_access",outcome.proof,{
   httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",
   path:"/",maxAge:outcome.maxAge,
 });
 return response;
}
