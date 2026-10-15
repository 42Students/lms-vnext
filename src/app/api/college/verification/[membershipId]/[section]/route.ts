import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {VerificationStateError} from "@/modules/profile-verification/domain";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {getCollegeVerificationDetail} from "@/modules/verification/staff-review-detail-service";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{params:Promise<{membershipId:string;section:string}>}){
 try{
  const raw=await params;
  const input=z.strictObject({membershipId:z.string().uuid(),section:z.enum(["EDUCATION","IDENTITY"])}).parse(raw);
  const review=await getCollegeVerificationDetail(await getCurrentRequestContext(),input.membershipId,input.section);
  return NextResponse.json({review},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof VerificationStateError)return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(error instanceof VerificationUnavailableError)return NextResponse.json({error:error.message},{status:503});
  return apiErrorResponse(error);
 }
}
