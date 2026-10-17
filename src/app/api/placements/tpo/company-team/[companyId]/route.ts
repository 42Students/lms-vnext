import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoCompanyTeam,mutateTpoCompanyTeam,TpoCompanyTeamError} from "@/modules/placements/tpo-company-team-service";
export const runtime="nodejs";
type Params={params:Promise<{companyId:string}>};
function safeError(error:unknown){
 if(error instanceof TpoCompanyTeamError)return NextResponse.json({error:error.code},{
  status:error.code==="STORAGE_PENDING"?503:error.code==="BAD_ACTION"?422:
   error.code==="STALE"?409:error.code==="NOT_AUTHORIZED"?403:404,
  headers:{"Cache-Control":"no-store"},
 });
 if(error instanceof ZodError)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
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
  const result=await mutateTpoCompanyTeam(await getCurrentRequestContext(),companyId,await request.json());
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(error){return safeError(error);}
}
