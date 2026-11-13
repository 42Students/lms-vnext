import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {emailAuthorizedCompanyShareCode} from "@/modules/placements/company-share/access-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Props={params:Promise<{token:string}>};
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {token}=params;
    const state=await emailAuthorizedCompanyShareCode(__ctx,token);
    if(state==="SENT")return NextResponse.json({sent:true},
   {headers:{"Cache-Control":CACHE.PRIVATE}});
    if(state==="TOO_SOON")return NextResponse.json({error:"EMAIL_TOO_SOON"},
   {status:429,headers:{"Cache-Control":CACHE.PRIVATE,"Retry-After":"60"}});
    if(state==="LIMITED")return NextResponse.json({error:"EMAIL_RATE_LIMITED"},
   {status:429,headers:{"Cache-Control":CACHE.PRIVATE,"Retry-After":"3600"}});
    if(state==="UNAVAILABLE")return NextResponse.json({error:"EMAIL_DELIVERY_UNAVAILABLE"},
   {status:503,headers:{"Cache-Control":CACHE.PRIVATE}});
    return NextResponse.json({error:"SHARE_ACCESS_DENIED"},
   {status:403,headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
