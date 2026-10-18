import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createRequestId} from "@/lib/request-id";
import {readTpoCompanyTeamBody,TpoCompanyTeamBodyError} from "@/modules/placements/tpo-company-team-request-body";
import {readTpoCompanyTeam,mutateTpoCompanyTeam,TpoCompanyTeamError} from "@/modules/placements/tpo-company-team-service";
export const runtime="nodejs";
type Params={params:Promise<{companyId:string}>};
function safeError(error:unknown){
 if(error instanceof TpoCompanyTeamBodyError){
  const requestId=createRequestId();
  const message=error.status===413?"The Team message is too large. Shorten it and try again.":
   error.status===415?"Send the Team update as JSON and try again.":
   "Check the Team update and try again.";
  return NextResponse.json({error:error.code,message,requestId},{status:error.status,
   headers:{"Cache-Control":"no-store","x-request-id":requestId}});
 }
 if(error instanceof TpoCompanyTeamError){
  const requestId=createRequestId();
  const status=error.code==="STORAGE_PENDING"?503:error.code==="BAD_ACTION"?422:
   error.code==="STALE"?409:error.code==="NOT_AUTHORIZED"?403:404;
  const message=error.code==="STORAGE_PENDING"
   ?"Company Team messages are temporarily unavailable. Retry later."
   :error.code==="STALE"?"This message changed. Reload the discussion and retry."
   :error.code==="NOT_AUTHORIZED"?"You do not have permission to change this message."
   :error.code==="NOT_FOUND"?"This company discussion is unavailable."
   :"Check the Team message details and try again.";
  return NextResponse.json({error:error.code,message,requestId},{status,
   headers:{"Cache-Control":"no-store","x-request-id":requestId}});
 }
 if(error instanceof ZodError){
  const requestId=createRequestId();
  return NextResponse.json({error:"INVALID_REQUEST",
   message:"Check the Team message details and try again.",requestId},{
   status:400,headers:{"Cache-Control":"no-store","x-request-id":requestId}});
 }
 return apiErrorResponse(error);
}
export async function GET(_request:Request,{params}:Params){
 try{
  const {companyId}=await params;
  const result=await readTpoCompanyTeam(await getCurrentRequestContext(),companyId);
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(error){return safeError(error);}
}
export async function POST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {companyId}=await params;
  const result=await mutateTpoCompanyTeam(await getCurrentRequestContext(),companyId,await readTpoCompanyTeamBody(request));
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(error){return safeError(error);}
}
