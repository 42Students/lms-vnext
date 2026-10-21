import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {readOwnApplicationResume,updateOwnApplicationResume}
 from "@/modules/placements/learner-application-resume-service";
export const runtime="nodejs";
type Params={params:Promise<{applicationId:string}>};
const headers={"Cache-Control":"private, no-store"};
function errorResponse(error:unknown){
 const value=error instanceof Error?error.message:"";
 if(value==="PLACEMENT_RESUME_NOT_FOUND")
  return NextResponse.json({error:"NOT_FOUND"},{status:404,headers});
 if(value==="PLACEMENT_RESUME_NOT_ACTIVE")
  return NextResponse.json({error:"APPLICATION_NOT_ACTIVE"},{status:409,headers});
 if(value==="PLACEMENT_RESUME_UNVERIFIED")
  return NextResponse.json({error:"FILE_NOT_VERIFIED"},{status:409,headers});
 if(error instanceof Error&&error.name==="ZodError")
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers});
 throw error;
}
export async function GET(_request:Request,{params}:Params){
 try{return NextResponse.json(await readOwnApplicationResume(
  await getCurrentRequestContext(),(await params).applicationId),{headers});}
 catch(error){return errorResponse(error);}
}
export async function POST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers});
 const body:unknown=await request.json().catch(()=>null);
 try{return NextResponse.json(await updateOwnApplicationResume(
  await getCurrentRequestContext(),(await params).applicationId,body),{headers});}
 catch(error){return errorResponse(error);}
}
