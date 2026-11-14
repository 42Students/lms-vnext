import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {isDatabaseUnavailableError} from "@/lib/db-outage";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {saveOwnPlacementJob,unsaveOwnPlacementJob,SavedJobsStorageUnavailableError} from "@/modules/placements/saved-job-service";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
import { zUuid } from "@/lib/schema-primitives";
export const runtime="nodejs";
type RouteContext={params:Promise<{jobId:string}>};

// Legacy integer IDs are not portable across colleges. The API accepts only
// migrated UUID job references and always derives the learner from auth scope.
function validateJobId(raw:string){
 return zUuid.safeParse(raw).success;
}
function savedJobError(error:unknown,action:"SAVE"|"UNSAVE"="SAVE"){
 const retryMessage=action==="UNSAVE"?
  "Failed to unsave. Please try again or contact support.":
  "Failed to save. Please try again or contact support.";
 if(error instanceof PlacementsServiceError &&
   error.code==="PLACEMENT_SAVED_JOB_UNAVAILABLE")
  return NextResponse.json({
   error:error.code,message:"This job is not available for your profile",
  },{status:404});
 if(error instanceof SavedJobsStorageUnavailableError || isDatabaseUnavailableError(error))
  return NextResponse.json({
   error:"SAVED_JOBS_NOT_CONFIGURED",message:retryMessage,
  },{status:503,headers:{"Retry-After":"60"}});
 const response=apiErrorResponse(error);
 if(response.status>=500)return NextResponse.json({
  error:"SAVED_JOB_OPERATION_FAILED",message:retryMessage,
 },{status:response.status,headers:{"Cache-Control":CACHE.NONE}});
 return response;
}
async function handlePOST(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {jobId}=await params;
 if(!validateJobId(jobId))
  return NextResponse.json({error:"INVALID_JOB_ID",message:"Invalid job ID"},{status:400});
 try{
  const saved=await saveOwnPlacementJob(await getCurrentRequestContext(),jobId);
  return NextResponse.json({saved:Boolean(saved),message:"Job saved"},{status:200});
 }catch(error){return savedJobError(error);}
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
async function handleDELETE(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {jobId}=await params;
 if(!validateJobId(jobId))
  return NextResponse.json({error:"INVALID_JOB_ID",message:"Invalid job ID"},{status:400});
 try{
  const result=await unsaveOwnPlacementJob(await getCurrentRequestContext(),jobId);
  return NextResponse.json({...result,saved:false,message:"Job removed from saved"},{status:200});
 }catch(error){return savedJobError(error,"UNSAVE");}
}
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleDELETE(request as Parameters<typeof handleDELETE>[0], { params: Promise.resolve(params) } as Parameters<typeof handleDELETE>[1]),
);
