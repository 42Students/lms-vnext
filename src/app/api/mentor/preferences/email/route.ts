import { route } from "@/security/route";
import {readBoundedUtf8Body} from "@/lib/request-body";
import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {mentorEmailPreferenceSaveSchema} from
 "@/modules/projects/mentor-email-preference-model";
import {saveMentorEmailPreference} from
 "@/modules/projects/mentor-email-preference-service";

import { CACHE } from "@/security/responses";
export const runtime="nodejs";
const headers={"Cache-Control":CACHE.PRIVATE};
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const decoded=await readBoundedUtf8Body(request,256);
    if(decoded.kind==="TOO_LARGE")
   return NextResponse.json({error:"INVALID_REQUEST"},{status:413,headers});
    if(decoded.kind!=="OK")
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers});
    let body:unknown;
    try{body=JSON.parse(decoded.body);}catch{
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers});
  }
    const parsed=mentorEmailPreferenceSaveSchema.safeParse(body);
    if(!parsed.success)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers});
    const result=await saveMentorEmailPreference(
   __ctx,parsed.data);
    return NextResponse.json(result,{headers});
  },
);
