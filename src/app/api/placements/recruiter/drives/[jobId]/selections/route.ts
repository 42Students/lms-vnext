import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {submitRecruiterSelectionList} from "@/modules/placements/recruiter-selection-list-write-service";

export const runtime="nodejs";

const requestErrors:Record<string,{status:number;message:string}>={
 RECRUITER_ACCESS_REQUIRED:{status:403,message:"Recruiter access is no longer available."},
 SELECTION_JOB_MISMATCH:{status:400,message:"The selected drive does not match this page."},
 SELECTION_COLLEGE_MISMATCH:{status:403,message:"This drive is not part of the active college."},
 SELECTION_DRIVE_CLOSED:{status:409,message:"This drive can no longer accept selection lists."},
 SELECTION_RESULTS_CHANGED:{status:409,message:"Round results have changed. Refresh and select applicants again."},
 SELECTION_AUDIENCE_CHANGED:{status:409,message:"The shared applicant list has changed. Refresh and try again."},
 SELECTION_CTC_CONFIRM_REQUIRED:{status:400,message:"Confirm the unusual CTC before sending."},
 SELECTION_IDEMPOTENCY_CONFLICT:{status:409,message:"This submission has already been used for a different selection list."},
 SELECTION_STORAGE_UNAVAILABLE:{status:503,message:"Selection submissions are temporarily unavailable. No selection list was sent."},
};

export async function POST(request:Request,{params}:{params:Promise<{jobId:string}>}){
 if(!isSameOriginRequest(request))
  return Response.json({error:"INVALID_ORIGIN"},{status:403});
 const input:unknown=await request.json().catch(()=>null);
 if(input===null)return Response.json({error:"INVALID_JSON"},{status:400});
 try{
  const {jobId}=await params;
  const saved=await submitRecruiterSelectionList(await getCurrentRequestContext(),jobId,input);
  return Response.json(saved,{status:saved.submitted?201:200,
   headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof z.ZodError)
   return Response.json({error:"INVALID_SELECTION",message:"Review the selection fields and try again."},{status:400});
  if(error instanceof Error&&Object.hasOwn(requestErrors,error.message)){
   const issue=requestErrors[error.message]!;
   return Response.json({error:error.message,message:issue.message},{status:issue.status});
  }
  return apiErrorResponse(error);
 }
}
