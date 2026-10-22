import "server-only";
import { and, count, eq, gte, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { companyJoinEmailCandidate } from "./public-join/company-preview-policy";
import { getDb } from "@/db/client";
import { placementTpoLeads, recruiterInviteCodes, placementCompanies,
  placementCompanyDomains, placementCompanyRelationships } from "@/db/schema";
import { isRecruiterInviteTokenShape, recruiterInviteTokenHash,
  requireRecruiterInviteUsable } from "./tpo-recruiter-invite-policy";
import { TpoRecruiterInviteServiceError } from "./tpo-recruiter-invite-service";
import { createRecruiterInviteOtp, recruiterOtpDigest,
  recruiterOtpSendAllowed, RECRUITER_OTP_TTL_MS } from "./recruiter-invite-otp-policy";

/**
 * T-S1-03 staged writer: a verified delivery adapter is mandatory. Never
 * return the six-digit code, the HMAC key, or the challenge hash to the UI.
 * No public send route may call this before schema registration and provider
 * confirmation; missing readiness fails closed.
 */
export async function requestRecruiterInviteOtp(
  token: string,
  deliver: (email: string, code: string) => Promise<boolean>,
  requestedWorkEmail?: string | null,
): Promise<{sent:true}> {
  if (process.env["TPO_RECRUITER_OTP_READY"] !== "VERIFIED") {
    throw new Error("RECRUITER_OTP_NOT_REGISTERED");
  }
  const secret = process.env["TPO_RECRUITER_OTP_HMAC_SECRET"];
  if (!secret || Buffer.byteLength(secret, "utf8") < 32 ||
      !isRecruiterInviteTokenShape(token)) {
    throw new TpoRecruiterInviteServiceError("TPO_RECRUITER_INVITE_NOT_FOUND");
  }
  const hash = recruiterInviteTokenHash(token);
  const typedEmail=requestedWorkEmail?.trim().toLowerCase() || null;
  if(typedEmail && !z.email().max(150).safeParse(typedEmail).success)
    throw new Error("COMPANY_EMAIL_REQUIRED");
  const code = createRecruiterInviteOtp();
  const challenge = await getDb().transaction(async (tx) => {
    const now = new Date();
    const [lead] = await tx.select().from(placementTpoLeads)
      .where(eq(placementTpoLeads.inviteTokenHash,hash))
      .for("update").limit(1);
    if (!lead) throw new TpoRecruiterInviteServiceError("TPO_RECRUITER_INVITE_NOT_FOUND");
    // A valid bearer link with incomplete college/company records can give
    // actionable errors without exposing any arbitrary account enumeration.
    if (!lead.companyRelationshipId) throw new Error("COMPANY_EMAIL_REQUIRED");
    try {
      requireRecruiterInviteUsable(token,lead,now);
    } catch {
      throw new TpoRecruiterInviteServiceError("TPO_RECRUITER_INVITE_NOT_FOUND");
    }
    let recipient=lead.emailNorm;
    if(recipient && typedEmail && recipient!==typedEmail)
      throw new Error("COMPANY_EMAIL_REQUIRED");
    if(!recipient){
      if(!typedEmail)throw new Error("EMAIL_REQUIRED");
      // Only the company linked by the persisted invitation can define which
      // new work mailbox is eligible for this OTP. A public caller cannot
      // choose an unrelated college, employer, or consumer mailbox.
      const [company]=await tx.select({
        companyId:placementCompanies.id,
        primaryDomain:placementCompanies.primaryDomain,
      }).from(placementCompanyRelationships)
        .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
        .where(and(
          eq(placementCompanyRelationships.id,lead.companyRelationshipId),
          eq(placementCompanyRelationships.collegeId,lead.collegeId),
          eq(placementCompanyRelationships.status,"ACTIVE"),
          isNull(placementCompanyRelationships.archivedAt),
          eq(placementCompanies.status,"ACTIVE"),
          isNull(placementCompanies.archivedAt),
        )).limit(1);
      if(!company)throw new Error("COMPANY_EMAIL_REQUIRED");
      const verified=await tx.select({domain:placementCompanyDomains.domain})
        .from(placementCompanyDomains).where(and(
          eq(placementCompanyDomains.companyId,company.companyId),
          eq(placementCompanyDomains.verifiedBy42,true),
        ));
      if(!companyJoinEmailCandidate(typedEmail,[
        company.primaryDomain??"",...verified.map(row=>row.domain),
      ]))throw new Error("COMPANY_EMAIL_REQUIRED");
      recipient=typedEmail;
    }
    // Serialize all issuers sharing a college, including separate lead rows.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${lead.collegeId}::text,0))`);
    const hourAgo=new Date(now.getTime()-3_600_000);
    const [[forLink],[forCollege]]=await Promise.all([
      tx.select({n:count()}).from(recruiterInviteCodes)
        .where(and(eq(recruiterInviteCodes.tokenHash,hash),
          gte(recruiterInviteCodes.sentAt,hourAgo))),
      tx.select({n:count()}).from(recruiterInviteCodes)
        .where(and(eq(recruiterInviteCodes.collegeId,lead.collegeId),
          gte(recruiterInviteCodes.sentAt,hourAgo))),
    ]);
    if (!recruiterOtpSendAllowed(forLink?.n??0,forCollege?.n??0)) {
      throw new Error("TOO_MANY_CODES");
    }
    if(!lead.emailNorm){
      // Bind the unassigned lead to the company-domain mailbox under the
      // invite row lock before issuing its one-time code. Acceptance later
      // uses only this persisted address, never client-supplied identity.
      const [bound]=await tx.update(placementTpoLeads)
        .set({emailNorm:recipient,updatedAt:now})
        .where(and(eq(placementTpoLeads.id,lead.id),
          eq(placementTpoLeads.inviteTokenHash,hash)))
        .returning({id:placementTpoLeads.id});
      if(!bound)throw new Error("RECRUITER_OTP_STORE_FAILED");
    }
    const [stored] = await tx.insert(recruiterInviteCodes).values({
      leadId:lead.id,collegeId:lead.collegeId,tokenHash:hash,
      codeHash:recruiterOtpDigest(hash,code,secret),
      sentAt:now,expiresAt:new Date(now.getTime()+RECRUITER_OTP_TTL_MS),
      deliveryState:"PENDING",
    }).returning({id:recruiterInviteCodes.id});
    if (!stored) throw new Error("RECRUITER_OTP_STORE_FAILED");
    return { id: stored.id, email:recipient };
  });
  let sent=false;
  try {
    sent=await deliver(challenge.email,code);
  } finally {
    await getDb().update(recruiterInviteCodes).set({
      deliveryState:sent?"SENT":"FAILED",
    }).where(and(
      eq(recruiterInviteCodes.id,challenge.id),
      eq(recruiterInviteCodes.deliveryState,"PENDING"),
    ));
  }
  if (!sent) throw new TpoRecruiterInviteServiceError("TPO_RECRUITER_INVITE_NOT_FOUND");
  return {sent:true};
}
