import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {markOwnMentorAttentionLater} from
 "@/modules/projects/mentor-attention-later-service";
export const runtime="nodejs";
const inputSchema=z.strictObject({key:z.string().min(8).max(320)});
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const text=await request.text();
  if(text.length>1024)return NextResponse.json({error:"INVALID_BODY"},{status:413});
  let input:unknown;
  try{input=JSON.parse(text);}catch{
   return NextResponse.json({error:"INVALID_BODY"},{status:400});
  }
  const {key}=inputSchema.parse(input);
  const result=await markOwnMentorAttentionLater(
    await getCurrentRequestContext(),key);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
