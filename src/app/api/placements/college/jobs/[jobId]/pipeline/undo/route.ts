import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {readBoundedJsonBody} from "@/lib/bounded-json-body";
import {apiErrorResponse} from "@/lib/api-error";
import {undoCollegeApplicationStage,COLLEGE_STAGE_UNDO_TOO_LATE}
 from "@/modules/placements/college-stage-undo-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"} as const;
type Params={params:Promise<{jobId:string}>};
export async function POST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 const payload=await readBoundedJsonBody(request,2048);
 if(payload.kind!=="OK")return NextResponse.json({error:"INVALID_REQUEST"},
  {status:payload.kind==="TOO_LARGE"?413:400,headers:noStore});
 try{
  const context=await getCurrentRequestContext();
  const {jobId}=await params;
  return NextResponse.json(await undoCollegeApplicationStage(context,jobId,payload.value),
   {headers:noStore});
 }catch(error){
  if(error instanceof Error&&error.message===COLLEGE_STAGE_UNDO_TOO_LATE)
   return NextResponse.json({error:"UNDO_TOO_LATE",message:COLLEGE_STAGE_UNDO_TOO_LATE},
    {status:409,headers:noStore});
  if(error instanceof ZodError)
   return NextResponse.json({error:"INVALID_UNDO_REQUEST"},{status:400,headers:noStore});
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store");
  return response;
 }
}
