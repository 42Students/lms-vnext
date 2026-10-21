import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, gt, isNull, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  activityEvents, colleges, placementCompanies,
  placementCompanyRelationships, placementPublicJoinLinks,
  placementJobs, placementPublicExternalJobLinks,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { placementCompanyDomainSchema } from "./validation";
import { requirePlacementManageScope } from "./scope";
import { publicJoinTablesReady } from "./public-join/readiness";
import {
  publicJoinLinkPath, tpoPublicJoinLinkChangeSchema,tpoPublicJoinLinkToggleSchema,
  tpoPublicJoinPostingPolicySchema,
  type TpoPublicJoinLinkStatus,
} from "./tpo-public-join-link-model";

type Scope = "COMPANY" | "COLLEGE";
export class TpoPublicJoinLinkError extends Error {
  constructor(readonly code:
    "NOT_REGISTERED" | "NOT_FOUND" | "DOMAIN_REQUIRED" | "ALREADY_EXISTS" | "STALE") {
    super(code === "DOMAIN_REQUIRED"
      ? "Add the company\'s email domain first, so only its people can join"
      : code === "NOT_FOUND" ? "Not found" : "TPO_PUBLIC_JOIN_LINK_" + code);
    this.name = "TpoPublicJoinLinkError";
  }
}

async function requireTpoLinkScope(context: RequestContext) {
  const membership = context.membership;
  if (!membership || membership.status !== "ACTIVE" ||
      !(hasMembershipRole(context, "TPO")||hasMembershipRole(context, "COLLEGE_ADMIN")) || context.user.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  const college = await requirePlacementManageScope(context, collegeId);
  return { college, membership };
}

function linkFilter(collegeId: string, scope: Scope, companyId?: string) {
  return and(
    eq(placementPublicJoinLinks.collegeId, collegeId),
    eq(placementPublicJoinLinks.scope, scope),
    scope === "COMPANY" && companyId
      ? eq(placementPublicJoinLinks.companyId, companyId)
      : isNull(placementPublicJoinLinks.companyId),
    isNull(placementPublicJoinLinks.revokedAt),
  );
}

async function findCompanyDomain(collegeId: string, companyId: string) {
  const [row] = await getDb().select({
    primaryDomain: placementCompanies.primaryDomain,
  }).from(placementCompanyRelationships)
    .innerJoin(placementCompanies,
      eq(placementCompanyRelationships.companyId, placementCompanies.id))
    .where(and(
      eq(placementCompanyRelationships.collegeId, collegeId),
      eq(placementCompanyRelationships.companyId, companyId),
      eq(placementCompanyRelationships.status, "ACTIVE"),
      eq(placementCompanies.status, "ACTIVE"),
    )).limit(1);
  if (!row) throw new TpoPublicJoinLinkError("NOT_FOUND");
  const parsed = placementCompanyDomainSchema.safeParse(row.primaryDomain);
  return parsed.success ? parsed.data : null;
}

/** No original token is persisted or re-displayed on a subsequent read. */
export async function getTpoPublicJoinLinkStatus(
  context: RequestContext, scope: Scope, companyId?: string,
): Promise<TpoPublicJoinLinkStatus & {postDirect:boolean;linkRecovery:"REPLACE_REQUIRED"|"NONE"}> {
  const { college } = await requireTpoLinkScope(context);
  const domain = scope === "COMPANY"
    ? await findCompanyDomain(college.id, companyId ?? "")
    : null;
  if (!await publicJoinTablesReady()) return { ready: false, domain, link: null,
    postDirect:false,linkRecovery:"NONE" };
  const [row] = await getDb().select({
    id: placementPublicJoinLinks.id,createdAt: placementPublicJoinLinks.createdAt,
    opensCount: placementPublicJoinLinks.opensCount,joinsCount: placementPublicJoinLinks.joinsCount,
    enabled:placementPublicJoinLinks.enabled,
    postWithoutApproval:placementPublicJoinLinks.postWithoutApproval,
  }).from(placementPublicJoinLinks)
    .where(and(linkFilter(college.id, scope, companyId),
      gt(placementPublicJoinLinks.expiresAt, new Date())))
    .orderBy(desc(placementPublicJoinLinks.createdAt)).limit(1);
  return { ready: true, domain,
    // Only a hash is stored. Do not pretend the original token can be recovered;
    // show the operator a rotation action and copy the replacement once.
    linkRecovery:row?"REPLACE_REQUIRED":"NONE",
    postDirect:row?.postWithoutApproval??false,
    link: row ? { id:row.id,createdAt: row.createdAt.toISOString(),opensCount:row.opensCount,joinsCount:row.joinsCount,enabled:row.enabled } : null };
}

/** The one-time URL is returned only from this authenticated, same-origin POST. */
export async function changeTpoPublicJoinLink(context: RequestContext, raw: unknown) {
  const input = tpoPublicJoinLinkChangeSchema.parse(raw);
  const { college, membership } = await requireTpoLinkScope(context);
  if (!await publicJoinTablesReady()) throw new TpoPublicJoinLinkError("NOT_REGISTERED");
  const companyId = input.scope === "COMPANY" ? input.companyId : undefined;
  const domain = input.scope === "COMPANY"
    ? await findCompanyDomain(college.id, input.companyId)
    : null;
  if (input.scope === "COMPANY" && !domain) {
    throw new TpoPublicJoinLinkError("DOMAIN_REQUIRED");
  }
  return getDb().transaction(async (tx) => {
    await assertPersistedPlatformPermission(tx, context, "placements.manage", {
      organizationId: college.organizationId, collegeId: college.id,
    });
    // Serialize create/replacement per college; there is not yet a unique-active-link index.
    const [locked] = await tx.select({ id: colleges.id }).from(colleges)
      .where(and(eq(colleges.id, college.id), eq(colleges.status, "ACTIVE")))
      .for("update").limit(1);
    if (!locked) throw new TpoPublicJoinLinkError("NOT_FOUND");
    if (companyId) {
      // The relationship can have changed between the initial check and this lock.
      const [relationship] = await tx.select({ id: placementCompanyRelationships.id })
        .from(placementCompanyRelationships)
        .innerJoin(placementCompanies,
          eq(placementCompanies.id, placementCompanyRelationships.companyId))
        .where(and(
          eq(placementCompanyRelationships.collegeId, college.id),
          eq(placementCompanyRelationships.companyId, companyId),
          eq(placementCompanyRelationships.status, "ACTIVE"),
          eq(placementCompanies.status, "ACTIVE"),
        )).limit(1);
      if (!relationship) throw new TpoPublicJoinLinkError("NOT_FOUND");
    }
    const filter = linkFilter(college.id, input.scope, companyId);
    const [existing] = await tx.select({ id: placementPublicJoinLinks.id })
      .from(placementPublicJoinLinks).where(and(
        filter, gt(placementPublicJoinLinks.expiresAt, new Date()),
      )).limit(1);
    if (input.action === "CREATE" && existing) {
      throw new TpoPublicJoinLinkError("ALREADY_EXISTS");
    }
    if (input.action === "REPLACE" && (!existing || existing.id!==input.expectedLinkId)) {
      throw new TpoPublicJoinLinkError("STALE");
    }
    const now = new Date();
    await tx.update(placementPublicJoinLinks)
      .set({ revokedAt: now }).where(filter);
    const token = randomBytes(32).toString("base64url");
    const [link] = await tx.insert(placementPublicJoinLinks).values({
      collegeId: college.id, companyId: companyId ?? null,
      companyDomain: domain, scope: input.scope,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      // This vNext table requires an expiry. Use a real annual renewal period,
      // never an arbitrary year-9999 sentinel presented as a permanent link.
      expiresAt: new Date(Date.UTC(now.getUTCFullYear()+1,now.getUTCMonth(),now.getUTCDate(),0,0,0)),
      // Never grant direct posting merely by creating or rotating a URL.
      postWithoutApproval:false,
    }).returning({ id: placementPublicJoinLinks.id, createdAt: placementPublicJoinLinks.createdAt,opensCount:placementPublicJoinLinks.opensCount,joinsCount:placementPublicJoinLinks.joinsCount });
    if (!link) throw new TpoPublicJoinLinkError("STALE");
    await tx.insert(activityEvents).values({
      organizationId: college.organizationId, collegeId: college.id,
      actorUserId: context.user.id, actorMembershipId: membership.id,
      module: "PLACEMENTS", eventType: "PLACEMENTS_PUBLIC_RECRUITER_LINK_CHANGED",
      subjectType: "placement_public_join_link", subjectId: link.id,
      subjectLabel: input.scope === "COMPANY" ? "Company link" : "Public recruiter link",
      summary: input.action === "CREATE" ? "Public join link made" : "Public join link replaced",
      metadata: { scope: input.scope, companyId: companyId ?? null },
    });
    return {
      path: publicJoinLinkPath(input.scope, token),
      // Caller adds trusted app origin before copying the shareable link.
      sharePath: publicJoinLinkPath(input.scope, token),
      shareWarning: "Copy it now: for safety it is shown only once. It expires after approximately one year; replace it to renew.",
      status: { ready: true, domain, link: { id:link.id,createdAt: link.createdAt.toISOString(),opensCount:link.opensCount,joinsCount:link.joinsCount,enabled:true } },
    };
  });
}

/** Explicit TPO opt-in switch: college-scoped, permission-checked and audited. */
export async function setTpoPublicJoinLinkEnabled(context:RequestContext,raw:unknown) {
 const input=tpoPublicJoinLinkToggleSchema.parse(raw);
 const {college,membership}=await requireTpoLinkScope(context);
 if(!await publicJoinTablesReady())throw new TpoPublicJoinLinkError("NOT_REGISTERED");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const filter=linkFilter(college.id,input.scope,input.scope==="COMPANY"?input.companyId:undefined);
  const [row]=await tx.select({
   id:placementPublicJoinLinks.id,enabled:placementPublicJoinLinks.enabled,
  })
   .from(placementPublicJoinLinks).where(and(filter,gt(placementPublicJoinLinks.expiresAt,new Date())))
   .orderBy(desc(placementPublicJoinLinks.createdAt)).for("update").limit(1);
  if(!row)throw new TpoPublicJoinLinkError("NOT_FOUND");
  if(row.id!==input.expectedLinkId)throw new TpoPublicJoinLinkError("STALE");
  // A parallel retry of the same switch is a no-op: do not double-audit.
  if(row.enabled===input.enabled)return {enabled:row.enabled};
  await tx.update(placementPublicJoinLinks).set({enabled:input.enabled})
   .where(eq(placementPublicJoinLinks.id,row.id));
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:membership.id,
   module:"PLACEMENTS",eventType:"PLACEMENTS_PUBLIC_JOIN_LINK_ENABLED",
   subjectType:"placement_public_join_link",subjectId:row.id,
   summary:input.enabled?"Public join link enabled":"Public join link disabled",
   metadata:{scope:input.scope,enabled:input.enabled},
  });
  return {enabled:input.enabled};
 });
}

/** A public job application link is not a recruiter onboarding invitation.
 * The same link is valid only while the scoped job is published and external. */
const publicJobIdSchema=z.string().uuid();
export async function getTpoExternalJobShare(context:RequestContext,rawJobId:unknown){
 const {college}=await requireTpoLinkScope(context);
 const jobId=publicJobIdSchema.parse(rawJobId);
 const [row]=await getDb().select({
  id:placementJobs.id,status:placementJobs.status,
  applicationMode:placementJobs.applicationMode,
  slug:placementJobs.publicExternalSlug,
 }).from(placementJobs).where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,college.id))).limit(1);
 if(!row)throw new TpoPublicJoinLinkError("NOT_FOUND");
 if(!["HYBRID","EXTERNAL_ONLY"].includes(row.applicationMode))return {eligible:false,path:null};
 return {eligible:true,path:row.slug&&row.status==="PUBLISHED"?
  "/public/placement-job/"+row.slug:null};
}

/** Generate an unguessable job slug while holding the single job row lock.
 * A cancelled/closed/draft/internal drive can never publish a shareable link. */
export async function createTpoExternalJobShare(context:RequestContext,rawJobId:unknown){
 const {college,membership}=await requireTpoLinkScope(context);
 const jobId=publicJobIdSchema.parse(rawJobId);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [job]=await tx.select({id:placementJobs.id,status:placementJobs.status,
   applicationMode:placementJobs.applicationMode,slug:placementJobs.publicExternalSlug})
   .from(placementJobs).where(and(eq(placementJobs.id,jobId),
    eq(placementJobs.collegeId,college.id))).for("update").limit(1);
  if(!job)throw new TpoPublicJoinLinkError("NOT_FOUND");
  if(job.status!=="PUBLISHED"||!["HYBRID","EXTERNAL_ONLY"].includes(job.applicationMode))
   throw new TpoPublicJoinLinkError("NOT_FOUND");
  const slug=job.slug??("smr-"+randomBytes(8).toString("hex"));
  const [already]=await tx.select({id:placementPublicExternalJobLinks.id})
   .from(placementPublicExternalJobLinks)
   .where(and(eq(placementPublicExternalJobLinks.jobId,job.id),
    eq(placementPublicExternalJobLinks.collegeId,college.id),
    eq(placementPublicExternalJobLinks.slug,slug),
    isNull(placementPublicExternalJobLinks.revokedAt))).limit(1);
  if(!already){
   await tx.insert(placementPublicExternalJobLinks).values({
    jobId:job.id,collegeId:college.id,slug,
   });
  }
  if(!job.slug)await tx.update(placementJobs).set({publicExternalSlug:slug})
   .where(and(eq(placementJobs.id,job.id),eq(placementJobs.collegeId,college.id)));
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:membership.id,
   module:"PLACEMENTS",eventType:"PLACEMENTS_EXTERNAL_JOB_LINK_SHARED",
   subjectType:"placement_job",subjectId:job.id,
   summary:"External application link shared",metadata:{applicationMode:job.applicationMode},
  });
  return {eligible:true,path:"/public/placement-job/"+slug};
 });
}

/** Public presentation is intentionally small: never include applicants,
 * recruiter invitation state, college grants or private employer contacts. */
export async function readPublicExternalJobShare(rawSlug:string){
 if(!/^smr-[0-9a-f]{16}$/.test(rawSlug))throw new TpoPublicJoinLinkError("NOT_FOUND");
 return getDb().transaction(async tx=>{
  const [row]=await tx.select({
   id:placementJobs.id,collegeId:placementJobs.collegeId,
   title:placementJobs.title,description:placementJobs.description,
   applicationMode:placementJobs.applicationMode,
   externalApplicationUrl:placementJobs.externalApplicationUrl,
   applicationDeadline:placementJobs.applicationDeadline,
   companyName:placementCompanies.name,
   linkId:placementPublicExternalJobLinks.id,
  }).from(placementPublicExternalJobLinks)
   .innerJoin(placementJobs,and(eq(placementJobs.id,placementPublicExternalJobLinks.jobId),
     eq(placementJobs.collegeId,placementPublicExternalJobLinks.collegeId)))
   .innerJoin(placementCompanyRelationships,and(
    eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,placementJobs.collegeId)))
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .where(and(eq(placementPublicExternalJobLinks.slug,rawSlug),
    isNull(placementPublicExternalJobLinks.revokedAt),eq(placementJobs.status,"PUBLISHED"),
    inArray(placementJobs.applicationMode,["HYBRID","EXTERNAL_ONLY"]),
    eq(placementJobs.publicExternalSlug,rawSlug),
    eq(placementCompanyRelationships.status,"ACTIVE"),eq(placementCompanies.status,"ACTIVE")))
   .limit(1);
  if(!row)throw new TpoPublicJoinLinkError("NOT_FOUND");
  await tx.update(placementPublicExternalJobLinks)
   .set({viewsCount:sql`${placementPublicExternalJobLinks.viewsCount}+1`})
   .where(eq(placementPublicExternalJobLinks.id,row.linkId));
  return {job:{id:row.id,title:row.title,description:row.description,
   companyName:row.companyName,applicationMode:row.applicationMode,
   applicationDeadline:row.applicationDeadline?.toISOString()??null,
   externalApplicationUrl:row.externalApplicationUrl}};
 });
}
