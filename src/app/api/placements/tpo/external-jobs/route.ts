import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {createPublicExternalJobLink} from "@/modules/placements/public-external-job-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const json:unknown=await request.json();
  const jobId=json&&typeof json==="object"&&!Array.isArray(json)&&"jobId" in json
   ?(json as {jobId:unknown}).jobId:null;
  return NextResponse.json(await createPublicExternalJobLink(
   await getCurrentRequestContext(),jobId),{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof Error&&error.message==="PUBLIC_EXTERNAL_JOB_NOT_FOUND")
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(error instanceof Error&&error.name==="ZodError")
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  throw error;
 }
}
