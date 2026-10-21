import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {emailAuthorizedCompanyShareCode} from "@/modules/placements/company-share/access-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Props={params:Promise<{token:string}>};
export async function POST(request:Request,{params}:Props){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {token}=await params;
  const state=await emailAuthorizedCompanyShareCode(await getCurrentRequestContext(),token);
  if(state==="SENT")return NextResponse.json({sent:true},
   {headers:{"Cache-Control":"private, no-store"}});
  if(state==="LIMITED")return NextResponse.json({error:"EMAIL_RATE_LIMITED"},
   {status:429,headers:{"Cache-Control":"private, no-store","Retry-After":"3600"}});
  if(state==="UNAVAILABLE")return NextResponse.json({error:"EMAIL_DELIVERY_UNAVAILABLE"},
   {status:503,headers:{"Cache-Control":"private, no-store"}});
  return NextResponse.json({error:"SHARE_ACCESS_DENIED"},
   {status:403,headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
