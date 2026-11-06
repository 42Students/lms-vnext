import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {VerificationStateError} from "@/modules/profile-verification/domain";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {openCollegeVerificationDocument} from "@/modules/verification/staff-private-document-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handleGET(_request:Request,{params}:{params:Promise<{membershipId:string;section:string;receiptId:string}>}){
 try{
  const input=z.strictObject({membershipId:z.string().uuid(),section:z.enum(["EDUCATION","IDENTITY"]),receiptId:z.string().uuid()}).parse(await params);
  const grant=await openCollegeVerificationDocument(await getCurrentRequestContext(),input.membershipId,input.section,input.receiptId);
  return NextResponse.redirect(grant.readUrl,{status:302,headers:{"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
 }catch(error){
  if(error instanceof VerificationStateError)return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(error instanceof VerificationUnavailableError)return NextResponse.json({error:error.message},{status:503});
  return apiErrorResponse(error);
 }
}
export const GET = secured(handleGET);
