import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {VerificationStateError} from "@/modules/profile-verification/domain";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {openCollegeVerificationDocument} from "@/modules/verification/staff-private-document-service";
import {requireTpoVerificationActor} from "@/modules/verification/tpo-staff-auth";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{membershipId:string;section:string;receiptId:string}>}){
 try{
  const input=z.strictObject({membershipId:z.string().uuid(),section:z.enum(["EDUCATION","IDENTITY"]),receiptId:z.string().uuid()}).parse(await params);
  const context=await getCurrentRequestContext();
  await requireTpoVerificationActor(context);
  const grant=await openCollegeVerificationDocument(context,input.membershipId,input.section,input.receiptId,undefined,true);
  return NextResponse.redirect(grant.readUrl,{status:302,headers:{"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
 }catch(error){
  // A new browser tab opening a signed document must show a human message,
  // never a raw JSON error code or private storage details.
  if(request.headers.get("accept")?.includes("text/html"))
   return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><title>You cannot open this document</title><body><main><h1>You cannot open this document</h1><p>Try again from Verification, or ask your placement cell for access.</p></main></body></html>',{
    status:404,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"},
   });
  if(error instanceof VerificationStateError)return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(error instanceof VerificationUnavailableError)return NextResponse.json({error:error.message},{status:503});
  return apiErrorResponse(error);
 }
}
