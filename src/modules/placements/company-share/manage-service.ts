import "server-only";
import { and, count, desc, eq, gt, inArray, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { projectCompanyShareAudit } from "./audit-history-model";
import {tpoCompanyAuditKindSchema} from "./audit-kind-model";
import {companyShareAuditPageSchema,COMPANY_SHARE_AUDIT_PAGE_SIZE,COMPANY_SHARE_AUDIT_EXPORT_LIMIT} from "./audit-page-model";
import { getDb } from "@/db/client";
import { collegeMemberships, membershipRoles, placementJobs, users } from "@/db/schema";
import { AuthorizationError } from "@/modules/permissions/policy";
import type { RequestContext } from "@/modules/identity/context";
import { requireTpoReadCollege } from "../tpo-surface-access";
import { companyShareTablesReady } from "./readiness";
import { placementCompanyApplicantShares as shares, placementCompanyApplicantShareViews as views } from "./staged-schema";
import { companyShareAuditTotals } from "./audit-model";
import {canIssueCompanyApplicantShare} from "./issue-policy";
import { companyShareStatusSchema } from "./status-model";
import {companyShareLinkPageSchema,COMPANY_SHARE_PAGE_SIZE} from "./link-page-model";
import { isShareableJob } from "./scope-model";
import {
  companyShareExpiry, companyShareIssueSchema,
  companyShareRevokeSchema, issueCompanyShareToken,
} from "./token-model";

export class CompanyShareError extends Error {
  constructor(public readonly code: "MIGRATION_PENDING"|"NOT_FOUND"|"NOT_SHAREABLE"|"ACTIVE_LINK_LIMIT") {
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
  const actorMembershipId=context.membership.id;
  return getDb().transaction(async tx=>{
    // A job-row lock serializes simultaneous officers issuing for one drive.
    const [job]=await tx.select({id:placementJobs.id})
      .from(placementJobs)
      .where(and(eq(placementJobs.id,parsed.jobId),
        eq(placementJobs.collegeId,college.id),
        inArray(placementJobs.status,["PUBLISHED","CLOSED"])))
      .limit(1).for("update",{of:placementJobs});
    if(!job)throw new CompanyShareError("NOT_FOUND");
    const [existing]=await tx.select({total:count()}).from(shares).where(and(
      eq(shares.jobId,job.id),eq(shares.collegeId,college.id),
      isNull(shares.revokedAt),gt(shares.expiresAt,sql`clock_timestamp()`),
    ));
    if(!canIssueCompanyApplicantShare(existing?.total??0)){
      throw new CompanyShareError("ACTIVE_LINK_LIMIT");
    }
    const {token,digest}=issueCompanyShareToken();
    const expiresAt=companyShareExpiry(new Date(),parsed.expiresInDays);
    const [row]=await tx.insert(shares).values({
      collegeId:college.id,jobId:job.id,
      createdByMembershipId:actorMembershipId,
      tokenHash:digest,expiresAt,
    }).returning({id:shares.id});
    if(!row)throw new CompanyShareError("NOT_SHAREABLE");
    return {shareId:row.id,token,expiresAt:expiresAt.toISOString()};
  });
}
export async function listTpoCompanyApplicantShares(
 context: RequestContext, rawJobId: unknown, rawStatus:unknown="ALL", rawPage:unknown=1,
) {
  const status=companyShareStatusSchema.parse(rawStatus);
  const page=companyShareLinkPageSchema.parse(rawPage);
  const jobId = companyShareIssueSchema.shape.jobId.parse(rawJobId);
  const college = await tpoJob(context,jobId);
  if (!await companyShareTablesReady()) return {ready:false,links:[],page,totalPages:1,total:0};
  const now=new Date();
  const filter=and(eq(shares.collegeId,college.id),eq(shares.jobId,jobId),
    status==="ACTIVE"?and(isNull(shares.revokedAt),gt(shares.expiresAt,now)):
    status==="EXPIRED"?and(isNull(shares.revokedAt),lte(shares.expiresAt,now)):
    status==="REVOKED"?isNotNull(shares.revokedAt):undefined);
  const [totals,links]=await Promise.all([
    getDb().select({total:count()}).from(shares).where(filter),
    getDb().select({
      id:shares.id,expiresAt:shares.expiresAt,revokedAt:shares.revokedAt,
      createdAt:shares.createdAt,
    }).from(shares).where(filter)
      .orderBy(desc(shares.createdAt),desc(shares.id))
      .limit(COMPANY_SHARE_PAGE_SIZE).offset((page-1)*COMPANY_SHARE_PAGE_SIZE),
  ]);
  const total=totals[0]?.total??0;
  const totalPages=Math.max(1,Math.ceil(total/COMPANY_SHARE_PAGE_SIZE));
  const ids=links.map(link=>link.id);
  const stats=ids.length?await getDb().select({
    shareId:views.shareId,eventKind:views.eventKind,count:count(),
  }).from(views).where(and(
    eq(views.collegeId,college.id),inArray(views.shareId,ids),
  )).groupBy(views.shareId,views.eventKind):[];
  const byId=companyShareAuditTotals(stats);
  return {ready:true,page,total,totalPages,links:links.map(link=>({
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
export async function listTpoCompanyShareAudit(
 context:RequestContext,rawJobId:unknown,rawKind:unknown="ALL",
 rawPage:unknown=1,options:{exportAll?:boolean}={},
){
 const kind=tpoCompanyAuditKindSchema.parse(rawKind);
 const page=companyShareAuditPageSchema.parse(rawPage);
 const jobId=companyShareIssueSchema.shape.jobId.parse(rawJobId);
 const college=await tpoJob(context,jobId);
 if(!await companyShareTablesReady())return {ready:false,entries:[],limited:false,page};
 const rows=await getDb().select({
  shareId:views.shareId,eventKind:views.eventKind,occurredAt:views.occurredAt,
 }).from(views).innerJoin(shares,and(
  eq(shares.id,views.shareId),eq(shares.collegeId,views.collegeId),
 )).where(and(eq(shares.collegeId,college.id),eq(shares.jobId,jobId),
  kind==="ALL"?undefined:eq(views.eventKind,kind)))
  .orderBy(desc(views.occurredAt),desc(views.id))
  .limit((options.exportAll?COMPANY_SHARE_AUDIT_EXPORT_LIMIT:COMPANY_SHARE_AUDIT_PAGE_SIZE)+1)
  .offset(options.exportAll?0:(page-1)*COMPANY_SHARE_AUDIT_PAGE_SIZE);
 const limit=options.exportAll?COMPANY_SHARE_AUDIT_EXPORT_LIMIT:COMPANY_SHARE_AUDIT_PAGE_SIZE;
 return {ready:true,entries:projectCompanyShareAudit(rows.slice(0,limit)),
  page:options.exportAll?1:page,limited:rows.length>limit};
}
