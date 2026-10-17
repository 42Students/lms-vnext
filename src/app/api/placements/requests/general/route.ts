import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {TpoGeneralRequestError,createOwnTpoGeneralRequest,listOwnTpoGeneralRequests} from "@/modules/placements/tpo-general-request-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{return NextResponse.json({requests:await listOwnTpoGeneralRequests(await getCurrentRequestContext())},
  {headers:{"Cache-Control":"private, no-store"}});}
 catch(error){
  if(error instanceof TpoGeneralRequestError&&error.code==="UNAVAILABLE")
   return NextResponse.json({error:"REQUESTS_NOT_READY"},{status:503});
  return apiErrorResponse(error);
 }
}
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const result=await createOwnTpoGeneralRequest(await getCurrentRequestContext(),await request.json());
  return NextResponse.json(result,{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TpoGeneralRequestError)return NextResponse.json({error:error.code},
   {status:error.code==="UNAVAILABLE"?503:error.code==="TARGET_CHANGED"?409:403});
  return apiErrorResponse(error);
 }
}
