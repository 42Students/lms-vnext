import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {hrDriveProposalSchema} from "@/modules/placements/hr-drive-proposal-model";
import {sendRecruiterDriveProposal,TpoMessagingError} from "@/modules/placements/tpo-messaging-service";

export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const body=await request.json().catch(()=>null);
 const parsed=hrDriveProposalSchema.safeParse(body);
 if(!parsed.success)
  return NextResponse.json({error:"INVALID_PROPOSAL"},{status:400});
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context))
  return NextResponse.json({error:"FORBIDDEN"},{status:403});
 try{
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
  throw error;
 }
}
