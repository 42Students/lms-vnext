import "server-only";
import {NextResponse} from "next/server";
import {verifyPublicCompanyShareCode} from "./access-service";
import {companyShareTokenSchema} from "./token-model";
export const legacyShareHeaders={
 "Cache-Control":"private, no-store","Referrer-Policy":"no-referrer",
 "X-Content-Type-Options":"nosniff","X-Robots-Tag":"noindex, nofollow, noarchive",
} as const;
export function legacyShareInvalid(){
 return NextResponse.json({code:"SHARE_INVALID",message:"This link is not valid any more."},
  {status:404,headers:legacyShareHeaders});
}
export async function legacyShareVerify(token:unknown,code:unknown){
 if(!companyShareTokenSchema.safeParse(token).success)return null;
 const result=await verifyPublicCompanyShareCode(token,code);
 return result.kind==="VERIFIED"?result:null;
}
export function legacyShareCookie(response:NextResponse,access:{proof:string;maxAge:number}){
 response.cookies.set("company_share_access",access.proof,{
  httpOnly:true,secure:process.env.NODE_ENV==="production",
  sameSite:"strict",path:"/",maxAge:access.maxAge,
 });
 return response;
}
export async function legacyShareBody(request:Request){
 if(request.headers.get("content-type")?.includes("application/json")){
  const body:unknown=await request.json().catch(()=>null);
  return body&&typeof body==="object"?body:null;
 }
 const form=await request.formData().catch(()=>null);
 return form?{code:form.get("code"),kind:form.get("kind")}:null;
}
export function legacyShareCode(body:unknown):string|null{
 if(!body||typeof body!=="object"||!("code" in body))return null;
 return typeof body.code==="string"&&/^\\d{6}$/.test(body.code)?body.code:null;
}
