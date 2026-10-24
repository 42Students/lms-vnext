import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {markOwnMentorSourceRead} from
  "@/modules/projects/mentor-notification-source-receipts-service";

export const runtime="nodejs";
const inputSchema=z.strictObject({key:z.string().min(8).max(320)});

export async function POST(request:Request){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
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
    const result=await markOwnMentorSourceRead(await getCurrentRequestContext(),key);
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return apiErrorResponse(error);}
}
