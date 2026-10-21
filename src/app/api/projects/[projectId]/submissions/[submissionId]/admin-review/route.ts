import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {reviewAdminProjectSubmission} from "@/modules/projects/admin-submission-review-service";
export const runtime="nodejs";

export async function POST(request:Request,{params}:{
 params:Promise<{projectId:string;submissionId:string}>,
}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const advertised=Number(request.headers.get("content-length")??"0");
 if(!Number.isFinite(advertised)||advertised>8192)
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
 try{
  const raw=await request.text();
  if(raw.length>8192)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  let body:unknown;
  try{body=JSON.parse(raw);}catch{return NextResponse.json({error:"INVALID_BODY"},{status:400});}
  const context=await getCurrentRequestContext(),{projectId,submissionId}=await params;
  const result=await reviewAdminProjectSubmission(context,projectId,submissionId,body);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
