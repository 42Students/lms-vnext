import "server-only";
import { and, count, desc, eq, gt, inArray, isNotNull, isNull, lte } from "drizzle-orm";
import { projectCompanyShareAudit } from "./audit-history-model";
import {tpoCompanyAuditKindSchema} from "./audit-kind-model";
import { getDb } from "@/db/client";
import { collegeMemberships, membershipRoles, placementJobs, users } from "@/db/schema";
import { AuthorizationError } from "@/modules/permissions/policy";
import type { RequestContext } from "@/modules/identity/context";
import { requireTpoReadCollege } from "../tpo-surface-access";
import { companyShareTablesReady } from "./readiness";
import { placementCompanyApplicantShares as shares, placementCompanyApplicantShareViews as views } from "./staged-schema";
import { companyShareAuditTotals } from "./audit-model";
import { companyShareStatusSchema } from "./status-model";
import { isShareableJob } from "./scope-model";
import {
  companyShareExpiry, companyShareIssueSchema,
  companyShareRevokeSchema, issueCompanyShareToken,
} from "./token-model";

export class CompanyShareError extends Error {
  constructor(public readonly code: "MIGRATION_PENDING"|"NOT_FOUND"|"NOT_SHAREABLE") {
    super(code);
  }
}
async function requirePersistedShareOfficer(context:RequestContext, collegeId:string){
  const membershipId=context.membership?.id;
  if(!membershipId)throw new AuthorizationError("placements.manage");
  const [actor]=await getDb().select({id:collegeMemberships.id})
    .from(collegeMemberships)
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"TPO"),
    ))
    .innerJoin(users,and(
      eq(users.id,collegeMemberships.userId),
      eq(users.platformStatus,"ACTIVE"),
    ))
    .where(and(
      eq(collegeMemberships.id,membershipId),
      eq(collegeMemberships.collegeId,collegeId),
      eq(collegeMemberships.userId,context.user.id),
      eq(collegeMemberships.status,"ACTIVE"),
    )).limit(1);
  if(!actor)throw new AuthorizationError("placements.manage");
}
async function tpoJob(context: RequestContext, jobId: string) {
  const college = await requireTpoReadCollege(context);
  await requirePersistedShareOfficer(context,college.id);
  const [job] = await getDb().select({
    id: placementJobs.id, collegeId: placementJobs.collegeId,
    status: placementJobs.status,
  }).from(placementJobs).where(and(
    eq(placementJobs.id, jobId), eq(placementJobs.collegeId,college.id),
  )).limit(1);
  if (!isShareableJob(college.id,job?.collegeId??null,job?.status??null)) {
    throw new CompanyShareError("NOT_FOUND");
  }
  return college;
}
export async function issueTpoCompanyApplicantShare(context: RequestContext, raw: unknown) {
  const parsed = companyShareIssueSchema.parse(raw);
  const college = await tpoJob(context,parsed.jobId);
  if (!await companyShareTablesReady()) throw new CompanyShareError("MIGRATION_PENDING");
  if (!context.membership) throw new CompanyShareError("NOT_FOUND");
  const {token,digest} = issueCompanyShareToken();
  const expiresAt = companyShareExpiry(new Date(),parsed.expiresInDays);
  const [row] = await getDb().insert(shares).values({
    collegeId:college.id, jobId:parsed.jobId,
    createdByMembershipId:context.membership.id,
    tokenHash:digest, expiresAt,
  }).returning({id:shares.id});
  if (!row) throw new CompanyShareError("NOT_SHAREABLE");
  return {shareId:row.id,token,expiresAt:expiresAt.toISOString()};
}
export async function listTpoCompanyApplicantShares(context: RequestContext, rawJobId: unknown, rawStatus:unknown="ALL") {
  const status=companyShareStatusSchema.parse(rawStatus);
  const jobId = companyShareIssueSchema.shape.jobId.parse(rawJobId);
  const college = await tpoJob(context,jobId);
  if (!await companyShareTablesReady()) return {ready:false,links:[]};
  const links = await getDb().select({
    id:shares.id, expiresAt:shares.expiresAt, revokedAt:shares.revokedAt,
    createdAt:shares.createdAt,
  }).from(shares).where(and(eq(shares.collegeId,college.id),eq(shares.jobId,jobId),
    status==="ACTIVE"?and(isNull(shares.revokedAt),gt(shares.expiresAt,new Date())):
    status==="EXPIRED"?and(isNull(shares.revokedAt),lte(shares.expiresAt,new Date())):
    status==="REVOKED"?isNotNull(shares.revokedAt):undefined))
    .orderBy(desc(shares.createdAt),desc(shares.id)).limit(50);
  const ids=links.map(link=>link.id);
  const stats=ids.length?await getDb().select({
    shareId:views.shareId,eventKind:views.eventKind,count:count(),
  }).from(views).where(and(
    eq(views.collegeId,college.id),inArray(views.shareId,ids),
  )).groupBy(views.shareId,views.eventKind):[];
  const byId=companyShareAuditTotals(stats);
  return {ready:true,links:links.map(link=>({
    ...link, audit:byId.get(link.id)??{views:0,exports:0},
  }))};
}
export async function revokeTpoCompanyApplicantShare(context: RequestContext, raw: unknown) {
  const input = companyShareRevokeSchema.parse(raw);
  const college = await tpoJob(context,input.jobId);
  if (!await companyShareTablesReady()) throw new CompanyShareError("MIGRATION_PENDING");
  const [updated] = await getDb().update(shares).set({revokedAt:new Date()})
    .where(and(eq(shares.id,input.shareId),eq(shares.collegeId,college.id),
      eq(shares.jobId,input.jobId),isNull(shares.revokedAt)))
    .returning({id:shares.id});
  // Unknown, foreign and previously-revoked ids are indistinguishable.
  if (!updated) throw new CompanyShareError("NOT_FOUND");
  return {revoked:true};
}

/** Recent scoped access history; no token hash, visitor address, or PII is selected. */
export async function listTpoCompanyShareAudit(context:RequestContext,rawJobId:unknown,rawKind:unknown="ALL"){
 const kind=tpoCompanyAuditKindSchema.parse(rawKind);
 const jobId=companyShareIssueSchema.shape.jobId.parse(rawJobId);
 const college=await tpoJob(context,jobId);
 if(!await companyShareTablesReady())return {ready:false,entries:[],limited:false};
 const rows=await getDb().select({
  shareId:views.shareId,eventKind:views.eventKind,occurredAt:views.occurredAt,
 }).from(views).innerJoin(shares,and(
  eq(shares.id,views.shareId),eq(shares.collegeId,views.collegeId),
 )).where(and(eq(shares.collegeId,college.id),eq(shares.jobId,jobId),
  kind==="ALL"?undefined:eq(views.eventKind,kind)))
  .orderBy(desc(views.occurredAt),desc(views.id)).limit(101);
 return {ready:true,entries:projectCompanyShareAudit(rows.slice(0,100)),
  limited:rows.length>100};
}
