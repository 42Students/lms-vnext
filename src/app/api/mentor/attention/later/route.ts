import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {markOwnMentorAttentionLater} from
 "@/modules/projects/mentor-attention-later-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
const inputSchema=z.strictObject({key:z.string().min(8).max(320)});
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
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
    await getCurrentRequestContext(),key);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
