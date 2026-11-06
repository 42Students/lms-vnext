import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listPopularFacultyDirectory,recordFacultyDirectorySelection}
 from "@/modules/people/college-role-directory-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"};
async function handleGET(){
 try{
  const items=await listPopularFacultyDirectory(await getCurrentRequestContext(),10);
  return NextResponse.json({items},{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = secured(handleGET);
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  const raw:unknown=await request.json();
  const parsed=z.strictObject({facultyMembershipId:z.uuid()}).parse(raw);
  const outcome=await recordFacultyDirectorySelection(
   await getCurrentRequestContext(),parsed.facultyMembershipId);
  return NextResponse.json(outcome,{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST);
