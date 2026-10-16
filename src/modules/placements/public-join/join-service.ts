import "server-only";

import { createHash } from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  activityEvents, colleges, organizations, placementCompanies,
  placementCompanyRelationships, placementPublicJoinLinks,
  placementPublicJoinChallenges, placementRecruiterProfiles,
  placementRecruiterCollegeGrants, placementTpoCollegeSettings, users,
} from "@/db/schema";
import { publicCollegeJoinTokenSchema, publicCollegeJoinCodeSchema,
  publicRecruiterWorkEmailSchema, workEmailDomain } from "../public-college-join-model";
import { publicJoinFormSchema } from "./form-model";
import { matchesPublicJoinCode, PUBLIC_JOIN_MAX_FAILURES, PUBLIC_JOIN_PER_IP_JOIN_HOUR } from "./code-policy";
import { opaqueNetworkTag, PublicJoinCodeError } from "./send-code-service";
import { publicJoinTablesReady } from "./readiness";
import { recruiterGrantValidUntil, recruiterGrantEffectiveAt } from "../recruiter-grant-expiry-policy";

type Scope = "COLLEGE" | "COMPANY";
export const publicJoinAcceptSchema = publicJoinFormSchema.extend({
  token: publicCollegeJoinTokenSchema, code: publicCollegeJoinCodeSchema,
}).strict();

export class PublicJoinAcceptError extends Error {
  constructor(readonly code: "INVALID" | "REMOVED" | "NOT_CONFIGURED" |
    "RATE_LIMITED" | "NETWORK_GUARD_NOT_READY") {
    super("PUBLIC_JOIN_" + code);
    this.name = "PublicJoinAcceptError";
  }
}

/** A verified mailbox and one consumed code authorize a single recruiter grant.
 * All user/company/profile/grant writes are one transaction, never staged
 * by the browser. The company/college comes only from the live hashed token.
 */
export async function acceptPublicRecruiterJoin(
  scope: Scope, raw: unknown, verifiedClientIp: string | null,
): Promise<{ joined: true; outcome: "JOINED" | "ALREADY_JOINED" }> {
  const input = publicJoinAcceptSchema.safeParse(raw);
  if (!input.success) throw new PublicJoinAcceptError("INVALID");
  const secret = process.env.TPO_RECRUITER_OTP_HMAC_SECRET ?? "";
  let ipTag: string;
  try { ipTag = opaqueNetworkTag(verifiedClientIp ?? "", secret); }
  catch { throw new PublicJoinAcceptError("NETWORK_GUARD_NOT_READY"); }
  if (!await publicJoinTablesReady()) throw new PublicJoinAcceptError("NOT_CONFIGURED");
  const ready = await getDb().execute<{ ready: boolean }>(sql`
    select to_regclass('public.placement_public_join_rate_events') is not null as ready
  `);
  if (ready.rows[0]?.ready !== true) throw new PublicJoinAcceptError("NETWORK_GUARD_NOT_READY");
  const { token, code, email, name, companyName, designation } = input.data;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const decision = await getDb().transaction(async tx => {
    const now = new Date();
    const [link] = await tx.select({
      id: placementPublicJoinLinks.id,
      collegeId: placementPublicJoinLinks.collegeId,
      organizationId: colleges.organizationId,
      companyId: placementPublicJoinLinks.companyId,
      companyDomain: placementPublicJoinLinks.companyDomain,
    }).from(placementPublicJoinLinks)
      .innerJoin(colleges, eq(colleges.id, placementPublicJoinLinks.collegeId))
      .innerJoin(organizations, eq(organizations.id, colleges.organizationId))
      .where(and(eq(placementPublicJoinLinks.tokenHash, tokenHash),
        eq(placementPublicJoinLinks.scope, scope),
        isNull(placementPublicJoinLinks.revokedAt),
        gt(placementPublicJoinLinks.expiresAt, now),
        eq(colleges.status, "ACTIVE"), eq(organizations.status, "ACTIVE")))
      .for("update").limit(1);
    if (!link) return "DENIED";
    const emailDomain = workEmailDomain(email);
    if (!emailDomain || (scope === "COMPANY" && emailDomain !== link.companyDomain)) return "DENIED";
    const hourAgo = new Date(now.getTime() - 60 * 60_000);
    const counts = await tx.execute<{ n: number }>(sql`
      select count(*)::integer as n from placement_public_join_rate_events
      where ip_hash = ${ipTag}::varchar and action = 'JOIN'
        and created_at >= ${hourAgo}::timestamptz
    `);
    if ((counts.rows[0]?.n ?? 0) >= PUBLIC_JOIN_PER_IP_JOIN_HOUR) return "RATE_LIMITED";
    await tx.execute(sql`
      insert into placement_public_join_rate_events (link_id, ip_hash, action)
      values (${link.id}::uuid, ${ipTag}::varchar, 'JOIN')
    `);
    const [challenge] = await tx.select().from(placementPublicJoinChallenges)
      .where(and(eq(placementPublicJoinChallenges.linkId, link.id),
        eq(placementPublicJoinChallenges.workEmail, email)))
      .orderBy(desc(placementPublicJoinChallenges.createdAt),
        desc(placementPublicJoinChallenges.id))
      .for("update").limit(1);
    if (!challenge || challenge.verifiedAt ||
        challenge.expiresAt.getTime() <= now.getTime() ||
        challenge.attempts >= PUBLIC_JOIN_MAX_FAILURES) return "DENIED";
    if (!matchesPublicJoinCode(challenge.codeHash, link.id, email, code, secret)) {
      await tx.update(placementPublicJoinChallenges)
        .set({ attempts: challenge.attempts + 1 })
        .where(eq(placementPublicJoinChallenges.id, challenge.id));
      return "DENIED";
    }
    const [settings] = await tx.select({
      months: placementTpoCollegeSettings.recruiterAccessMonths,
    }).from(placementTpoCollegeSettings)
      .where(eq(placementTpoCollegeSettings.collegeId, link.collegeId))
      .for("share").limit(1);
    if (!settings || settings.months < 1 || settings.months > 60) return "NOT_CONFIGURED";
    // Reuse a real user for this verified work email. Never relabel an existing identity.
    await tx.insert(users).values({
      identityUid: "public-recruiter-email:" + createHash("sha256").update(email).digest("hex"),
      email, displayName: name,
    }).onConflictDoNothing();
    const [user] = await tx.select().from(users)
      .where(sql`lower(${users.email}) = ${email}`).for("update").limit(1);
    if (!user || user.platformStatus !== "ACTIVE") return "DENIED";
    let companyId = link.companyId;
    if (companyId) {
      const [company] = await tx.select({ id: placementCompanies.id })
        .from(placementCompanies)
        .where(and(eq(placementCompanies.id, companyId),
          eq(placementCompanies.status, "ACTIVE"))).limit(1);
      if (!company) return "DENIED";
    } else {
      const [existingCompany] = await tx.select({ id: placementCompanies.id,
        status: placementCompanies.status })
        .from(placementCompanies)
        .where(sql`lower(${placementCompanies.primaryDomain}) = ${emailDomain}`)
        .limit(1);
      if (existingCompany && existingCompany.status !== "ACTIVE") return "DENIED";
      if (existingCompany) companyId = existingCompany.id;
      else {
        if (companyName.trim().length < 2) return "DENIED";
        const [sameName] = await tx.select({ id: placementCompanies.id }).from(placementCompanies)
          .where(sql`lower(${placementCompanies.name}) = lower(${companyName})`).limit(1);
        if (sameName) return "DENIED";
        const [created] = await tx.insert(placementCompanies).values({
          name: companyName, primaryDomain: emailDomain, createdByUserId: user.id,
        }).returning({ id: placementCompanies.id });
        if (!created) return "DENIED";
        companyId = created.id;
      }
    }
    if (!companyId) return "DENIED";
    await tx.insert(placementCompanyRelationships).values({
      collegeId: link.collegeId, companyId, createdByUserId: user.id,
    }).onConflictDoNothing();
    const [relationship] = await tx.select().from(placementCompanyRelationships)
      .where(and(eq(placementCompanyRelationships.collegeId, link.collegeId),
        eq(placementCompanyRelationships.companyId, companyId))).for("update").limit(1);
    if (!relationship || relationship.status !== "ACTIVE") return "DENIED";
    await tx.insert(placementRecruiterProfiles).values({
      userId: user.id, companyId, title: designation || null, createdByUserId: user.id,
    }).onConflictDoNothing();
    const [profile] = await tx.select().from(placementRecruiterProfiles)
      .where(eq(placementRecruiterProfiles.userId, user.id)).for("update").limit(1);
    if (!profile || profile.companyId !== companyId || profile.status !== "ACTIVE") return "DENIED";
    const [grant] = await tx.select().from(placementRecruiterCollegeGrants)
      .where(and(eq(placementRecruiterCollegeGrants.recruiterUserId, user.id),
        eq(placementRecruiterCollegeGrants.companyRelationshipId, relationship.id)))
      .orderBy(desc(placementRecruiterCollegeGrants.createdAt))
      .for("update").limit(1);
    if (grant && grant.status === "REVOKED") return "REMOVED";
    let outcome: "JOINED" | "ALREADY_JOINED" = "JOINED";
    if (grant) {
      if (!recruiterGrantEffectiveAt(grant, now, "DRIVES")) return "REMOVED";
      outcome = "ALREADY_JOINED";
    } else {
      await tx.insert(placementRecruiterCollegeGrants).values({
        recruiterUserId: user.id,
        companyRelationshipId: relationship.id,
        grantedByUserId: user.id,
        validUntil: recruiterGrantValidUntil(now, settings.months),
        capabilities: ["DRIVES"], verificationStatus: "VERIFIED",
      });
      await tx.insert(activityEvents).values({
        organizationId: link.organizationId, collegeId: link.collegeId,
        actorUserId: user.id, module: "PLACEMENTS",
        eventType: "PLACEMENTS_RECRUITER_PUBLIC_JOIN",
        subjectType: "placement_company_relationship", subjectId: relationship.id,
        subjectLabel: "Recruiter joined", summary: "Recruiter joined through public link",
        metadata: { scope, companyId, recruiterUserId: user.id },
      });
    }
    await tx.update(placementPublicJoinChallenges)
      .set({ verifiedAt: now })
      .where(and(eq(placementPublicJoinChallenges.id, challenge.id),
        isNull(placementPublicJoinChallenges.verifiedAt)));
    return outcome;
  });
  if (decision === "RATE_LIMITED") throw new PublicJoinAcceptError("RATE_LIMITED");
  if (decision === "REMOVED") throw new PublicJoinAcceptError("REMOVED");
  if (decision === "NOT_CONFIGURED") throw new PublicJoinAcceptError("NOT_CONFIGURED");
  if (decision !== "JOINED" && decision !== "ALREADY_JOINED") {
    throw new PublicJoinAcceptError("INVALID");
  }
  return { joined: true, outcome: decision };
}
