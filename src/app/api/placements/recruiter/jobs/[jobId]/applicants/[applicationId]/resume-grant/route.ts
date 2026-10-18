import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {grantRecruiterSharedResume,RecruiterResumeUnavailable}
 from "@/modules/placements/recruiter-applicant-resume-service";
export const runtime="nodejs";
type Params={params:Promise<{jobId:string;applicationId:string}>};
export async function POST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  if(!hasActiveRecruiter(context)||context.recruiter?.userId!==context.user.id)
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  const {jobId,applicationId}=await params;
  const grant=await grantRecruiterSharedResume(context,jobId,applicationId);
  return NextResponse.json({grant},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof RecruiterResumeUnavailable||error instanceof z.ZodError)
   return NextResponse.json({error:"RESUME_NOT_AVAILABLE"},{status:404});
  // Do not disclose file existence, storage configuration, scanner verdict or
  // an employer grant's private scope details to the requesting client.
  return NextResponse.json({error:"RESUME_NOT_AVAILABLE"},{status:404});
 }
}
