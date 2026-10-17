import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {verifyPublicCompanyShareCode} from "@/modules/placements/company-share/access-service";
import {companyShareTokenSchema} from "@/modules/placements/company-share/token-model";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request,{params}:{params:Promise<{token:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {token}=await params;
 if(!companyShareTokenSchema.safeParse(token).success)return new Response(null,{status:404});
 let code:FormDataEntryValue|null=null;
 try{const data=await request.formData();code=data.get("code");}catch{}
 const outcome=await verifyPublicCompanyShareCode(token,typeof code==="string"?code:null);
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
