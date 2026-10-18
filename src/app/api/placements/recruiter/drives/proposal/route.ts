import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {isSameOriginRequest} from "@/auth/origin";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {hrDriveProposalSchema} from "@/modules/placements/hr-drive-proposal-model";
import {readRecruiterJsonBody,RecruiterJsonBodyError} from "@/modules/placements/recruiter-json-request";
import {sendRecruiterDriveProposal,TpoMessagingError} from "@/modules/placements/tpo-messaging-service";

export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 let body:unknown;
 try{body=await readRecruiterJsonBody(request);}
 catch(error){return NextResponse.json({error:"INVALID_PROPOSAL"},
  {status:error instanceof RecruiterJsonBodyError&&error.kind==="TOO_LARGE"?413:400});}
 const parsed=hrDriveProposalSchema.safeParse(body);
 if(!parsed.success)
  return NextResponse.json({error:"INVALID_PROPOSAL"},{status:400});
 try{
  const context=await getCurrentRequestContext();
  if(!hasActiveRecruiter(context)||context.recruiter?.userId!==context.user.id)
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  const receipt=await sendRecruiterDriveProposal(context,parsed.data);
  return NextResponse.json(receipt,{status:receipt.replayed?200:201});
 }catch(error){
  if(error instanceof TpoMessagingError)
   return NextResponse.json({error:error.code==="TPO_MESSAGE_FORBIDDEN"?"FORBIDDEN":"NOT_FOUND"},
    {status:error.code==="TPO_MESSAGE_FORBIDDEN"?403:404});
  if(error instanceof z.ZodError)
   return NextResponse.json({error:"INVALID_PROPOSAL"},{status:400});
  if(error instanceof Error&&error.message==="DRIVE_PROPOSAL_MESSAGE_TOO_LONG")
   return NextResponse.json({error:"PROPOSAL_TOO_LONG"},{status:422});
  if(error instanceof Error&&error.message==="DRIVE_PROPOSAL_STALE_SUBMISSION")
   return NextResponse.json({error:"STALE_SUBMISSION"},{status:409});
  return apiErrorResponse(error);
 }
}
