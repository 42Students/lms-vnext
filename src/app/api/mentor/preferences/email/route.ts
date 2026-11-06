import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";
import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {mentorEmailPreferenceSaveSchema} from
 "@/modules/projects/mentor-email-preference-model";
import {saveMentorEmailPreference} from
 "@/modules/projects/mentor-email-preference-service";
import { secured } from "@/security/secure-handler";

export const runtime="nodejs";
const headers={"Cache-Control":"private, no-store"};
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers});
 try{
  // A streamed byte limit also covers chunked bodies without Content-Length.
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
   await getCurrentRequestContext(),parsed.data);
  return NextResponse.json(result,{headers});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST);
