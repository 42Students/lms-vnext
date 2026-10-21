import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  activityEvents, colleges, placementCompanies,
  placementCompanyRelationships, placementPublicJoinLinks,
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
      // The registered table requires an expiry; the legacy link has none.
      // A schema follow-up is proposed before claiming exact lifecycle parity.
      expiresAt: new Date("9999-12-31T00:00:00.000Z"),
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
      shareWarning: "Copy it now: for safety it is shown only once.",
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


/** Matches the old post_direct switch, but never bypasses authorization:
 * only a currently enabled, unrevoked and unexpired public link can post
 * without manual college approval. Null preserves the existing preference. */
export async function setTpoPublicJoinPostingPolicy(context:RequestContext,raw:unknown){
 const input=tpoPublicJoinPostingPolicySchema.parse(raw);
 const {college,membership}=await requireTpoLinkScope(context);
 if(!await publicJoinTablesReady())throw new TpoPublicJoinLinkError("NOT_REGISTERED");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const filter=linkFilter(college.id,input.scope,
   input.scope==="COMPANY"?input.companyId:undefined);
  const [row]=await tx.select({
   id:placementPublicJoinLinks.id,enabled:placementPublicJoinLinks.enabled,
   postWithoutApproval:placementPublicJoinLinks.postWithoutApproval,
   expiresAt:placementPublicJoinLinks.expiresAt,
  }).from(placementPublicJoinLinks).where(filter)
   .orderBy(desc(placementPublicJoinLinks.createdAt)).for("update").limit(1);
  if(!row||row.id!==input.expectedLinkId)throw new TpoPublicJoinLinkError("STALE");
  if(input.postDirect===null)return {postDirect:row.postWithoutApproval,unchanged:true};
  if(input.postDirect && (!row.enabled||row.expiresAt<=new Date()))
   throw new TpoPublicJoinLinkError("NOT_FOUND");
  if(row.postWithoutApproval===input.postDirect)
   return {postDirect:row.postWithoutApproval,unchanged:true};
  await tx.update(placementPublicJoinLinks).set({
   postWithoutApproval:input.postDirect,
  }).where(eq(placementPublicJoinLinks.id,row.id));
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:membership.id,
   module:"PLACEMENTS",eventType:"PLACEMENTS_PUBLIC_JOIN_POST_DIRECT_CHANGED",
   subjectType:"placement_public_join_link",subjectId:row.id,
   summary:input.postDirect?"Direct public posting enabled":"Direct public posting disabled",
   metadata:{scope:input.scope,postDirect:input.postDirect},
  });
  return {postDirect:input.postDirect,unchanged:false};
 });
}

/** Verification is mandatory at the moment of publishing, NOT just when
 * posting policy was last changed. */
export async function publicJoinLinkAllowsDirectPosting(
 context:RequestContext,scope:Scope,expectedLinkId:string,companyId?:string,
):Promise<boolean>{
 const {college}=await requireTpoLinkScope(context);
 if(!await publicJoinTablesReady())return false;
 const [row]=await getDb().select({
  enabled:placementPublicJoinLinks.enabled,
  postDirect:placementPublicJoinLinks.postWithoutApproval,
 }).from(placementPublicJoinLinks).where(and(
  linkFilter(college.id,scope,companyId),
  eq(placementPublicJoinLinks.id,expectedLinkId),
  gt(placementPublicJoinLinks.expiresAt,new Date()),
 )).limit(1);
 return row?.enabled===true&&row.postDirect===true;
}
