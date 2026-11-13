import { route } from "@/security/route";
import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {markOwnMentorAttentionLater} from
 "@/modules/projects/mentor-attention-later-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
const inputSchema=z.strictObject({key:z.string().min(8).max(320)});
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const decoded=await readBoundedUtf8Body(request,1024);
    if(decoded.kind==="TOO_LARGE")
   return NextResponse.json({error:"INVALID_BODY"},{status:413});
    if(decoded.kind!=="OK")
   return NextResponse.json({error:"INVALID_BODY"},{status:400});
    let input:unknown;
    try{input=JSON.parse(decoded.body);}catch{
   return NextResponse.json({error:"INVALID_BODY"},{status:400});
  }
    const {key}=inputSchema.parse(input);
    const result=await markOwnMentorAttentionLater(
    __ctx,key);
    return privateJson(result);
  },
);
