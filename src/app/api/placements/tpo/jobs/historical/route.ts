import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listTpoHistoricalJobVisibility} from "@/modules/placements/legacy-job-visibility-service";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const p=new URL(request.url).searchParams;
    const raw:Record<string,string>={};
    for(const [key,value] of p){
   if(Object.hasOwn(raw,key))return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
   raw[key]=value;
  }
    const result=await listTpoHistoricalJobVisibility(__ctx,raw);
    return NextResponse.json(result,{headers:{"cache-control":"no-store"}});
  },
);
