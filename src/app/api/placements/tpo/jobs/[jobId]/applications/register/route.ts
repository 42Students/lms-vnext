import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listTpoLegacyApplicationRegister} from "@/modules/placements/legacy-application-register-service";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    const parsed:Record<string,string>={};
    for(const [key,value] of new URL(request.url).searchParams){
   if(Object.hasOwn(parsed,key))return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
   parsed[key]=value;
  }
    const result=await listTpoLegacyApplicationRegister(
   __ctx,jobId,parsed);
    return NextResponse.json(result,{headers:{"cache-control":"no-store"}});
  },
);
