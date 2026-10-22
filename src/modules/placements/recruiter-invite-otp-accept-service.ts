import { recruiterAccessMonthsOrDefault } from "@/modules/placements/recruiter-access-defaults";
import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementCompanies,placementCompanyRelationships,
  placementRecruiterCollegeGrants,placementRecruiterProfiles,
  placementTpoCollegeSettings,placementTpoLeadActivities,placementTpoLeads,
  recruiterInviteCodes,users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { recruiterGrantValidUntil } from "./recruiter-grant-expiry-policy";
import {
  isRecruiterInviteTokenShape,recruiterInviteTokenHash,requireRecruiterInviteUsable,
} from "./tpo-recruiter-invite-policy";
import {
  recruiterOtpAttemptDecision,recruiterOtpMatches,recruiterInviteOtpSchema,
} from "./recruiter-invite-otp-policy";
import { TpoRecruiterInviteServiceError } from "./tpo-recruiter-invite-service";

/**
 * T-S1-03: authenticated first-party user's email must match the OTP target;
 * a client-supplied recruiterUserId is never accepted. The lead, latest code,
 * code consumption, token CAS and company grant are handled in ONE transaction.
 * Do not expose this service until DB migrations, auth bridge and OTP delivery
 * have independently passed their acceptance.
 */
export async function acceptTpoRecruiterInviteOtp(
  context:RequestContext, rawToken:unknown, rawCode:unknown,
):Promise<{accepted:true}> {
 if(process.env["TPO_RECRUITER_OTP_READY"]!=="VERIFIED")
   throw new Error("RECRUITER_OTP_NOT_REGISTERED");
 const secret=process.env["TPO_RECRUITER_OTP_HMAC_SECRET"];
 const invalid=()=>new TpoRecruiterInviteServiceError("TPO_RECRUITER_INVITE_NOT_FOUND");
 if(typeof rawToken!=="string" || !isRecruiterInviteTokenShape(rawToken) ||
    !recruiterInviteOtpSchema.safeParse(rawCode).success ||
    !secret || Buffer.byteLength(secret,"utf8")<32 ||
    context.user.platformStatus!=="ACTIVE") throw invalid();
 const token=rawToken, code=rawCode as string;
 const hash=recruiterInviteTokenHash(token);
 const outcome=await getDb().transaction(async tx=>{
   const now=new Date();
   const [lead]=await tx.select().from(placementTpoLeads)
     .where(eq(placementTpoLeads.inviteTokenHash,hash))
     .for("update").limit(1);
   if(!lead || !lead.emailNorm || !lead.companyRelationshipId)return "DENIED";
   try{requireRecruiterInviteUsable(token,lead,now);}catch{return "DENIED";}
   const [identity]=await tx.select({id:users.id,email:users.email,
      status:users.platformStatus}).from(users)
      .where(eq(users.id,context.user.id)).for("share").limit(1);
   if(!identity || identity.status!=="ACTIVE" ||
      !identity.email || identity.email.trim().toLowerCase()!==lead.emailNorm)
       return "DENIED";
   const [challenge]=await tx.select().from(recruiterInviteCodes)
      .where(and(
        eq(recruiterInviteCodes.leadId,lead.id),
        eq(recruiterInviteCodes.collegeId,lead.collegeId),
        eq(recruiterInviteCodes.tokenHash,hash),
      )).orderBy(desc(recruiterInviteCodes.sentAt),
         desc(recruiterInviteCodes.id)).for("update").limit(1);
   if(!challenge)return "DENIED";
   const decision=recruiterOtpAttemptDecision(challenge,now,
      recruiterOtpMatches(challenge.codeHash,hash,code,secret));
   if(decision==="LOCKED")return "DENIED";
   if(decision==="REJECT"){
     await tx.update(recruiterInviteCodes)
       .set({failedAttempts:challenge.failedAttempts+1})
       .where(eq(recruiterInviteCodes.id,challenge.id));
     return "DENIED";
   }
   const [relationship]=await tx.select({
     companyId:placementCompanyRelationships.companyId,
     status:placementCompanyRelationships.status,
     companyStatus:placementCompanies.status,
   }).from(placementCompanyRelationships)
     .innerJoin(placementCompanies,eq(placementCompanies.id,
       placementCompanyRelationships.companyId))
     .where(and(eq(placementCompanyRelationships.id,lead.companyRelationshipId),
       eq(placementCompanyRelationships.collegeId,lead.collegeId)))
     .for("share").limit(1);
   if(!relationship || relationship.status!=="ACTIVE" ||
      relationship.companyStatus!=="ACTIVE")return "DENIED";
   await tx.insert(placementTpoCollegeSettings).values({collegeId:lead.collegeId}).onConflictDoNothing();
   const [duration]=await tx.select({
      months:placementTpoCollegeSettings.recruiterAccessMonths,
   }).from(placementTpoCollegeSettings)
     .where(eq(placementTpoCollegeSettings.collegeId,lead.collegeId))
     .for("share").limit(1);
   const months=recruiterAccessMonthsOrDefault(duration?.months);
   if(months<1 || months>60)return "DENIED";
   const validUntil=recruiterGrantValidUntil(now,months);
   await tx.insert(placementRecruiterProfiles).values({
     userId:identity.id,companyId:relationship.companyId,
     createdByUserId:identity.id,
   }).onConflictDoNothing();
   const [profile]=await tx.select().from(placementRecruiterProfiles)
     .where(eq(placementRecruiterProfiles.userId,identity.id))
     .for("update").limit(1);
   if(!profile || profile.companyId!==relationship.companyId ||
      profile.status!=="ACTIVE")return "DENIED";
   const [grant]=await tx.insert(placementRecruiterCollegeGrants).values({
     recruiterUserId:identity.id,
     companyRelationshipId:lead.companyRelationshipId,
     grantedByUserId:identity.id,validUntil,
     capabilities:["DRIVES"],verificationStatus:"VERIFIED",
   }).onConflictDoNothing().returning({id:placementRecruiterCollegeGrants.id});
   if(!grant)return "DENIED"; // Never quietly renew existing active grants.
   const [used]=await tx.update(recruiterInviteCodes)
     .set({consumedAt:now})
     .where(and(eq(recruiterInviteCodes.id,challenge.id),
       isNull(recruiterInviteCodes.consumedAt)))
     .returning({id:recruiterInviteCodes.id});
   if(!used)throw invalid();
   const [accepted]=await tx.update(placementTpoLeads)
     .set({inviteTokenHash:null,recruiterUserId:identity.id,updatedAt:now})
     .where(and(eq(placementTpoLeads.id,lead.id),
       eq(placementTpoLeads.inviteTokenHash,hash),
       isNull(placementTpoLeads.recruiterUserId)))
     .returning({id:placementTpoLeads.id});
   if(!accepted)throw invalid();
   await tx.insert(placementTpoLeadActivities).values({
     collegeId:lead.collegeId,leadId:lead.id,type:"SYSTEM",
     isSystem:true,note:"Recruiter joined",createdAt:now,
   });
   return "ACCEPTED";
 });
 if(outcome!=="ACCEPTED")throw invalid();
 return {accepted:true};
}
