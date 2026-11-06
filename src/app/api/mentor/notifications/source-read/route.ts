import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {markOwnMentorSourceRead} from
  "@/modules/projects/mentor-notification-source-receipts-service";

export const runtime="nodejs";
const inputSchema=z.strictObject({key:z.string().min(8).max(320)});

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    if(Number(request.headers.get("content-length")??0)>1024)
      return NextResponse.json({error:"INVALID_REQUEST"},{status:413});
    const body=await request.text();
    if(body.length>1024)
      return NextResponse.json({error:"INVALID_REQUEST"},{status:413});
    let raw:unknown;
    try{raw=JSON.parse(body);}catch{
      return NextResponse.json({error:"INVALID_BODY"},{status:400});
    }
    const {key}=inputSchema.parse(raw);
    const result=await markOwnMentorSourceRead(__ctx,key);
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
