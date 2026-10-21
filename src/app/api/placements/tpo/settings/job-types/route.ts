import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createTpoJobType,saveTpoJobTypes,TpoConfigError} from "@/modules/placements/tpo-job-type-write-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const result=await createTpoJobType(await getCurrentRequestContext(),await request.json());
  return NextResponse.json(result,{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TpoConfigError)return NextResponse.json({error:error.code},{
   status:error.code==="TPO_JOB_TYPE_EXISTS"||error.code==="TPO_JOB_TYPE_LAST_ACTIVE"||error.code==="TPO_JOB_TYPE_BUILTIN"?409:error.code==="TPO_JOB_TYPE_LIMIT"?422:error.code==="TPO_SETTINGS_PENDING"?503:404});
  return apiErrorResponse(error);
 }
}

export async function PUT(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const result=await saveTpoJobTypes(await getCurrentRequestContext(),await request.json());
  return NextResponse.json({
    ...result,
    message:"Job types saved",
    contract:"ATOMIC_COLLEGE_LIST_REPLACEMENT",
    legacyEndpoint:"PUT /api/v1/tpo/settings/job-types",
    editorHref:"/tpo/settings?tab=job-types",
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TpoConfigError)return NextResponse.json({error:error.code,detail:error.detail},{
   status:error.code==="TPO_JOB_TYPE_IN_USE"||error.code==="TPO_SETTINGS_STALE"||
    error.code==="TPO_JOB_TYPE_EXISTS"||error.code==="TPO_JOB_TYPE_BUILTIN"||
    error.code==="TPO_JOB_TYPE_LAST_ACTIVE"?409:
    error.code==="TPO_JOB_TYPE_LIMIT"||error.code==="TPO_JOB_TYPE_INVALID_LIST"?422:error.code==="TPO_SETTINGS_PENDING"?503:404});
  return apiErrorResponse(error);
 }
}
