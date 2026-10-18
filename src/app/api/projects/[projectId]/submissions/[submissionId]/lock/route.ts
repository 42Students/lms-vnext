import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {lockAdminProjectSubmission} from "@/modules/projects/admin-submission-review-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{projectId:string;submissionId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  // A lock only accepts a reason of up to 4,000 characters. Bound request
  // size before authorization/database work so a malformed or oversized
  // submission cannot exhaust the admin endpoint with an enormous JSON body.
  const length=Number(request.headers.get("content-length")??"0");
  if(!Number.isSafeInteger(length)||length<0||length>8192)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const text=await request.text();
  if(text.length>8192)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  let command:unknown;
  try{command=JSON.parse(text);}catch{
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  }
  const {projectId,submissionId}=await params;
  const submission=await lockAdminProjectSubmission(await getCurrentRequestContext(),
   projectId,submissionId,command);
  return NextResponse.json({submission},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
