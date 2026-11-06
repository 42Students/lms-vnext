import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listCompanyCommunication,updateCompanyCommunication,CompanyCommunicationUnavailable}
 from "@/modules/placements/tpo-company-communication-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function handleGET(){
 try{return NextResponse.json(await listCompanyCommunication(await getCurrentRequestContext()),{
  headers:{"Cache-Control":"no-store"},
 });}catch(e){return apiErrorResponse(e);}
}
export const GET = secured(handleGET);
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{return NextResponse.json(await updateCompanyCommunication(
  await getCurrentRequestContext(),await request.json()));}
 catch(e){
  if(e instanceof CompanyCommunicationUnavailable)return NextResponse.json({error:"STORAGE_PENDING"},{status:503});
  if(e instanceof Error&&e.message==="COMPANY_NOT_IN_COLLEGE")
   return NextResponse.json({error:"COMPANY_NOT_FOUND"},{status:404});
  if(e instanceof ZodError)return NextResponse.json({error:"INVALID_COMPANY_STATE"},{status:422});
  return apiErrorResponse(e);
 }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
