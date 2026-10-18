import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createOwnRecruiterDriveRequest,updateOwnRecruiterDriveRequest,
 listOwnRecruiterDriveRequests,RecruiterDriveRequestError} from "@/modules/placements/recruiter-drive-request-service";
import {ZodError,z} from "zod";
import {readRecruiterJsonBody,RecruiterJsonBodyError} from "@/modules/placements/recruiter-json-request";
export const runtime="nodejs";
function errorResponse(error:unknown){
 if(error instanceof RecruiterJsonBodyError)return NextResponse.json({error:"INVALID_REQUEST"},{status:error.kind==="TOO_LARGE"?413:400});
 if(error instanceof ZodError)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
 if(error instanceof RecruiterDriveRequestError)return NextResponse.json({error:error.code},{
  status:error.code==="FORBIDDEN"?403:error.code==="NOT_FOUND"?404:409});
 // A database/provider outage must return the shared sanitized response with
 // a support request id, not an unhandled rejected route promise.
 return apiErrorResponse(error);
}
export async function GET(request:Request){
 try{const url=new URL(request.url);
  const allowed=["collegeId"];
  if([...url.searchParams.keys()].some(key=>!allowed.includes(key))||
     allowed.some(key=>url.searchParams.getAll(key).length>1))
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const collegeId=z.string().uuid().parse(url.searchParams.get("collegeId"));
  const requests=await listOwnRecruiterDriveRequests(await getCurrentRequestContext(),collegeId);
  return NextResponse.json({requests});}catch(e){return errorResponse(e);}
}
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const result=await createOwnRecruiterDriveRequest(await getCurrentRequestContext(),await readRecruiterJsonBody(request));
  return NextResponse.json(result,{status:result.replayed?200:201});}
 catch(e){return errorResponse(e);}
}
export async function PATCH(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const result=await updateOwnRecruiterDriveRequest(await getCurrentRequestContext(),await readRecruiterJsonBody(request));
  return NextResponse.json({request:result});}catch(e){return errorResponse(e);}
}
