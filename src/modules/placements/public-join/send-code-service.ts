import "server-only";

import { createHash, createHmac } from "node:crypto";
import {companyDomainAcceptsMail} from "../company-mail-domain-resolver";
import { and, count, eq, gte, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  colleges, organizations, placementPublicJoinLinks, placementPublicJoinChallenges,
  placementCompanies,
} from "@/db/schema";
import { publicJoinTablesReady } from "./readiness";
import { publicJoinSendCodeSchema, publicJoinCodeDigest,
  publicJoinCodeSendAllowed, newPublicJoinCode, PUBLIC_JOIN_CODE_TTL_MS,
} from "./code-policy";
import { companyJoinEmailCandidate } from "./company-preview-policy";
import {registrableWorkDomain} from "./domain-model";

type Scope = "COLLEGE" | "COMPANY";
export class PublicJoinCodeError extends Error {
  constructor(readonly code: "INVALID_LINK" | "RATE_LIMITED" |
    "NETWORK_GUARD_NOT_READY" | "DELIVERY_FAILED" | "EMAIL_NO_MX" | "EMAIL_MX_UNAVAILABLE") {
    super("PUBLIC_JOIN_" + code);
    this.name = "PublicJoinCodeError";
  }
}

export function opaqueNetworkTag(ip: string, secret: string) {
  if (!ip || ip.length > 120 || Buffer.byteLength(secret, "utf8") < 32) {
    throw new PublicJoinCodeError("NETWORK_GUARD_NOT_READY");
  }
  return createHmac("sha256", secret)
    .update("public-join-ip-v1:").update(ip).digest("hex");
}

/** Fail closed until the durable network limiter is registered and the trusted
 * proxy supplies a verified client IP; no in-memory/IP-spoofable substitute.
 */
export async function requestPublicJoinCode(
  scope: Scope, raw: unknown, verifiedClientIp: string | null,
  deliver: (email: string, code: string) => Promise<boolean>,
): Promise<{ sent: true;companyName:string|null }> {
  const input = publicJoinSendCodeSchema.safeParse(raw);
  if (!input.success) throw new PublicJoinCodeError("INVALID_LINK");
  const secret = process.env.TPO_RECRUITER_OTP_HMAC_SECRET ?? "";
  const rateSecret = process.env.TPO_RECRUITER_OTP_HMAC_SECRET ?? "";
  const ipTag = opaqueNetworkTag(verifiedClientIp ?? "", rateSecret);
  if (!await publicJoinTablesReady()) throw new PublicJoinCodeError("INVALID_LINK");
  const ready = await getDb().execute<{ ready: boolean }>(sql`
    select to_regclass('public.placement_public_join_rate_events') is not null as ready
  `);
  if (ready.rows[0]?.ready !== true) {
    throw new PublicJoinCodeError("NETWORK_GUARD_NOT_READY");
  }
  const digest = createHash("sha256").update(input.data.token).digest("hex");
  const email = input.data.email;
  // Reject expired, revoked and wrong-scope links BEFORE anonymous MX lookup.
  // The transaction below repeats this check under the link lock, so revocation
  // between preflight and the durable rate/OTP write still fails closed.
  const [availableLink] = await getDb().select({
    id: placementPublicJoinLinks.id, domain: placementPublicJoinLinks.companyDomain,
  }).from(placementPublicJoinLinks)
    .innerJoin(colleges, eq(placementPublicJoinLinks.collegeId, colleges.id))
    .innerJoin(organizations, eq(colleges.organizationId, organizations.id))
    .where(and(
      eq(placementPublicJoinLinks.tokenHash,digest),
      eq(placementPublicJoinLinks.scope,scope),
      eq(placementPublicJoinLinks.enabled,true),
      isNull(placementPublicJoinLinks.revokedAt),
      gt(placementPublicJoinLinks.expiresAt,new Date()),
      eq(colleges.status,"ACTIVE"), eq(organizations.status,"ACTIVE"),
    )).limit(1);
  if(!availableLink || (scope==="COMPANY" &&
      !companyJoinEmailCandidate(email,availableLink.domain??"")))
    throw new PublicJoinCodeError("INVALID_LINK");
  // The token is checked before DNS to avoid an anonymous domain oracle.
  // Legacy company-domain checks query the registrable company domain and
  // accept MX or A/AAAA fallback. A confirmed absence is NO_MAIL, whereas a
  // transient DNS failure is UNKNOWN and is not proof the address is invalid.
  // UNKNOWN may proceed ONLY to a bounded OTP send; ownership still requires
  // a delivered code, and the durable IP/link/email rate limits remain active.
  const emailHost = email.split("@")[1]!;
  const domain = scope === "COMPANY"
    ? (registrableWorkDomain(email) ?? emailHost)
    : emailHost;
  const dns = await companyDomainAcceptsMail(domain, true);
  if (dns.rejected) {
    // No challenge is written and no delivery is attempted for definite
    // NO_MAIL; the route maps this typed error to actionable user copy.
    throw new PublicJoinCodeError("EMAIL_NO_MX");
  }
  const code = newPublicJoinCode();
  const issued = await getDb().transaction(async tx => {
    const now = new Date();
    const [link] = await tx.select({
      id: placementPublicJoinLinks.id, domain: placementPublicJoinLinks.companyDomain,
    }).from(placementPublicJoinLinks)
      .innerJoin(colleges, eq(placementPublicJoinLinks.collegeId, colleges.id))
      .innerJoin(organizations, eq(colleges.organizationId, organizations.id))
      .where(and(eq(placementPublicJoinLinks.tokenHash, digest),
        eq(placementPublicJoinLinks.scope, scope),
        eq(placementPublicJoinLinks.enabled,true),
        isNull(placementPublicJoinLinks.revokedAt),
        gt(placementPublicJoinLinks.expiresAt, now),
        eq(colleges.status, "ACTIVE"), eq(organizations.status, "ACTIVE")))
      .for("update").limit(1);
    if (!link || (scope === "COMPANY" && !companyJoinEmailCandidate(email, link.domain ?? ""))) {
      throw new PublicJoinCodeError("INVALID_LINK");
    }
    const hourAgo = new Date(now.getTime() - 60 * 60_000);
    const [emailCount] = await tx.select({ n: count() }).from(placementPublicJoinChallenges)
      .where(and(eq(placementPublicJoinChallenges.linkId, link.id),
        eq(placementPublicJoinChallenges.workEmail, email),
        gte(placementPublicJoinChallenges.createdAt, hourAgo)));
    const [linkCount] = await tx.select({ n: count() }).from(placementPublicJoinChallenges)
      .where(and(eq(placementPublicJoinChallenges.linkId, link.id),
        gte(placementPublicJoinChallenges.createdAt, hourAgo)));
    const result = await tx.execute<{ n: number }>(sql`
      select count(*)::integer as n from placement_public_join_rate_events
      where ip_hash = ${ipTag}::varchar and action = 'SEND_CODE'
        and created_at >= ${hourAgo}::timestamptz
    `);
    if (!publicJoinCodeSendAllowed({
      emailHour: emailCount?.n ?? 0,
      linkHour: linkCount?.n ?? 0,
      networkHour: result.rows[0]?.n ?? 0,
    })) throw new PublicJoinCodeError("RATE_LIMITED");
    const [challenge] = await tx.insert(placementPublicJoinChallenges).values({
      linkId: link.id, workEmail: email,
      codeHash: publicJoinCodeDigest(link.id, email, code, secret),
      expiresAt: new Date(now.getTime() + PUBLIC_JOIN_CODE_TTL_MS),
    }).returning({ id: placementPublicJoinChallenges.id });
    if (!challenge) throw new PublicJoinCodeError("INVALID_LINK");
    await tx.execute(sql`
      insert into placement_public_join_rate_events (link_id, ip_hash, action)
      values (${link.id}::uuid, ${ipTag}::varchar, 'SEND_CODE')
    `);
    return { challengeId: challenge.id };
  });
  let sent = false;
  try {
    sent = await deliver(email, code);
  } catch {
    sent = false;
  } finally {
    if (!sent) await getDb().update(placementPublicJoinChallenges)
      .set({ expiresAt: new Date() })
      .where(eq(placementPublicJoinChallenges.id, issued.challengeId));
  }
  if (!sent) throw new PublicJoinCodeError("DELIVERY_FAILED");
  // Show a company only after we have successfully sent a verification code
  // to the provided mailbox, never as an unauthenticated domain oracle.
  return { sent: true,...(await lookupDeliveredJoinCompanyName(email)) };
}

/** Optional identity-safe company hint. A lookup outage after code acceptance
 * must not turn a successfully sent OTP into a false DELIVERY_FAILED. */
export async function lookupDeliveredJoinCompanyName(email:string):Promise<{companyName:string|null}>{
 const domain=registrableWorkDomain(email);
 if(!domain)return {companyName:null};
 try{
  const [known]=await getDb().select({name:placementCompanies.name})
   .from(placementCompanies).where(and(
    eq(placementCompanies.primaryDomain,domain),
    eq(placementCompanies.status,"ACTIVE"),
   )).limit(1);
  return {companyName:known?.name??null};
 }catch{
  return {companyName:null};
 }
}
