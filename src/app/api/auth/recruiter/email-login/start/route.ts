import {randomUUID} from "node:crypto";
import {NextResponse} from "next/server";
import {z} from "zod";
import {privateAuthResponse,privateAuthJson} from "@/modules/auth/private-response";
import {guardLoginRequest,loginErrorResponse,auditLogin,ipTag} from "@/modules/auth/http";
import {normalizeEmail,LoginError} from "@/modules/auth/login-service";
import {maskEmail} from "@/modules/auth/crypto";
import {drizzleLoginRepository} from "@/modules/auth/login-repository";
import {startLoginWithRuntime} from "@/modules/auth/runtime";
import {publicWorkEmailIssue} from "@/modules/placements/public-work-email-policy";

export const runtime="nodejs";
const schema=z.strictObject({
  channel:z.literal("EMAIL"),
  contact:z.string().trim().min(3).max(254),
});

/** Dedicated recruiter-email OTP entry. Unaccepted invites do not grant access:
 * only the active company profile and verified live college grant may get a real
 * challenge. Denied accounts get a never-stored dummy UUID, indistinguishable
 * from the allowed response but impossible to verify. Staff email login stays
 * on the ordinary channel and does not inherit corporate-email restrictions.
 */
export async function POST(request:Request){
  const guarded=await guardLoginRequest(request,schema,"recruiter-email-login-start",10);
  if(!guarded.ok)return guarded.response;
  const {ip,tenantCollegeId}=guarded;
  if(!tenantCollegeId)return privateAuthJson({
    error:"RECRUITER_COLLEGE_ADDRESS",
    message:"Recruiters sign in at their college's placement address, for example klu.42lms.com. You'll find it in your invitation email.",
  },{status:400});
  const email=normalizeEmail(guarded.body.contact);
  if(!email)return privateAuthJson({error:"INVALID_EMAIL"},{status:400});
  if(publicWorkEmailIssue(email)!==null)return privateAuthJson({
    error:"COMPANY_EMAIL_REQUIRED",
    message:"Use your work email. Personal email (Gmail, Yahoo, Outlook and similar) can't be used for recruiting.",
  },{status:400});

  const publicReply=(attemptId:string)=>privateAuthResponse(NextResponse.json({
    mode:"EMAIL_OTP_SENT" as const,
    attemptId,channel:"EMAIL" as const,maskedContact:maskEmail(email),
    maskedEmail:maskEmail(email),expiresInSeconds:300,
    emailFallbackAvailable:false,requiresSecondFactor:false,maskedPhone:null,
    message:"OTP triggered",nextStep:"VERIFY_CODE",
  }));
  try{
    const user=await drizzleLoginRepository.findUserByEmail(email);
    // No account, grant or invitation disclosure. Super Admin accounts must
    // use the ordinary two-factor flow, even with a recruiter affiliation.
    const eligible=Boolean(user&&user.platformStatus==="ACTIVE"&&
      !(await drizzleLoginRepository.isSuperAdmin(user.id))&&
      (await drizzleLoginRepository.hasRecruiterGrantAtCollege(user.id,tenantCollegeId)));
    if(!eligible){
      auditLogin("auth.recruiter_email_start_acknowledged",
        {route:"recruiter-email-login-start",ip});
      return publicReply(randomUUID());
    }
    const result=await startLoginWithRuntime({
      channel:"EMAIL",contact:email,tenantCollegeId,ipTag:ipTag(ip),
    });
    auditLogin("auth.recruiter_email_start_acknowledged",
      {route:"recruiter-email-login-start",ip});
    return publicReply(result.attemptId);
  }catch(error){
    // Authorization denials are the same as an unknown recruiter. Transport
    // or server failures must not be falsely reported as a sent code.
    if(error instanceof LoginError&&
      ["NOT_REGISTERED","NO_ACCOUNT_FOR_DOMAIN","ACCOUNT_DISABLED",
       "ACCOUNT_SUSPENDED","INVALID_ATTEMPT"].includes(error.code))
      return publicReply(randomUUID());
    return loginErrorResponse(error,{route:"recruiter-email-login-start",ip});
  }
}
