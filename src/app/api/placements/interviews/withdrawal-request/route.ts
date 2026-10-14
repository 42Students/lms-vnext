import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {requestOwnInterviewWithdrawal} from "@/modules/placements/learner-interview-withdrawal-service";
export async function POST(request:Request){
  if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    return NextResponse.json({request:await requestOwnInterviewWithdrawal(context,await request.json())},{status:201});
  }catch(error){return apiErrorResponse(error);}
}
