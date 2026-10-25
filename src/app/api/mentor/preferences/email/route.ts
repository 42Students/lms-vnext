import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {mentorEmailPreferenceSaveSchema} from
 "@/modules/projects/mentor-email-preference-model";
import {saveMentorEmailPreference} from
 "@/modules/projects/mentor-email-preference-service";

export const runtime="nodejs";
const headers={"Cache-Control":"private, no-store"};
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers});
 try{
  const raw=await request.text();
  if(raw.length>256)return NextResponse.json({error:"INVALID_REQUEST"},
    {status:413,headers});
  let body:unknown;
  try{body=JSON.parse(raw);}catch{
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
