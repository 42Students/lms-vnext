import "server-only";
import { and, count, desc, eq, gt, inArray, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { projectCompanyShareAudit } from "./audit-history-model";
import {tpoCompanyAuditKindSchema} from "./audit-kind-model";
import {companyShareAuditPageSchema,COMPANY_SHARE_AUDIT_PAGE_SIZE,COMPANY_SHARE_AUDIT_EXPORT_LIMIT,clampCompanyShareAuditPage} from "./audit-page-model";
import { getDb } from "@/db/client";
import {placementJobs,activityEvents,placementApplications,placementApplicationScreenings,collegeMemberships,users} from "@/db/schema";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {companyShareLifecycleActivity} from "./activity-model";
import {requirePersistedTpoMembership} from "../tpo-persisted-actor-service";
import type { RequestContext } from "@/modules/identity/context";
import { requireTpoReadCollege } from "../tpo-surface-access";
import { companyShareTablesReady } from "./readiness";
import { placementTableExists } from "../staged-tables";
import {placementCompanyShareSelections as selectedShares} from "@/db/schema/placement-company-share-selection";
import { placementCompanyApplicantShares as shares, placementCompanyApplicantShareViews as views } from "@/db/schema/placement-company-shares";
import { companyShareAuditTotals } from "./audit-model";
import {canIssueCompanyApplicantShare} from "./issue-policy";
import { companyShareStatusSchema } from "./status-model";
import {companyShareLinkPageSchema,COMPANY_SHARE_PAGE_SIZE,clampCompanyShareLinksPage} from "./link-page-model";
import { isShareableJob } from "./scope-model";
import {
  companyShareExpiry, companyShareIssueSchema,
  companyShareRevokeSchema, issueCompanyShareToken, issueCompanyShareAccessCode,
} from "./token-model";

export class CompanyShareError extends Error {
  constructor(public readonly code: "MIGRATION_PENDING"|"NOT_FOUND"|"NOT_SHAREABLE"|"ACTIVE_LINK_LIMIT") {
    super(code);
  }
}
async function tpoJob(context: RequestContext, jobId: string) {
  const college = await requireTpoReadCollege(context);
  await requirePersistedTpoMembership(context,college.id);
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
  // Both explicit and default shares persist an immutable applicant scope.
  // Never issue a public capability without its row-level authorization table.
  if(!await placementTableExists("placement_company_share_selections"))
    throw new CompanyShareError("MIGRATION_PENDING");
  if (!context.membership) throw new CompanyShareError("NOT_FOUND");
  const actorMembershipId=context.membership.id;
  return getDb().transaction(async tx=>{
    await assertPersistedPlatformPermission(tx,context,"placements.manage",{
      collegeId:college.id,organizationId:college.organizationId,
    });
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
    // An omitted explicit selection means "share the current shortlist".
    // Freeze that audience when issuing: later shortlisting must never expand
    // an already distributed token's access without another TPO decision.
    const requestedIds=parsed.selectedApplicationIds??null;
    const eligible=await tx.select({id:placementApplications.id}).from(placementApplications)
      .innerJoin(placementApplicationScreenings,
        eq(placementApplicationScreenings.applicationId,placementApplications.id))
      .innerJoin(collegeMemberships,
        eq(collegeMemberships.id,placementApplications.membershipId))
      .innerJoin(users,eq(users.id,collegeMemberships.userId))
      .where(and(eq(placementApplications.jobId,job.id),
        requestedIds?inArray(placementApplications.id,requestedIds):undefined,
        eq(placementApplications.status,"SUBMITTED"),
        eq(placementApplicationScreenings.status,"SHORTLISTED"),
        eq(collegeMemberships.collegeId,college.id),
        eq(collegeMemberships.status,"ACTIVE"),
        eq(users.platformStatus,"ACTIVE")))
      .orderBy(placementApplications.id)
      .limit(201);
    if(eligible.length>200 ||
       (requestedIds&&eligible.length!==requestedIds.length))
      throw new CompanyShareError("NOT_SHAREABLE");
    const selectedIds=eligible.map(candidate=>candidate.id);
    const {token,digest}=issueCompanyShareToken();
    const challenge=issueCompanyShareAccessCode();
    const expiresAt=companyShareExpiry(new Date(),parsed.expiresInDays);
    if(parsed.shortlistBy && Date.parse(parsed.shortlistBy)>expiresAt.getTime())
      throw new CompanyShareError("NOT_SHAREABLE");
    const [row]=await tx.insert(shares).values({
      collegeId:college.id,jobId:job.id,
      createdByMembershipId:actorMembershipId,
      tokenHash:digest,expiresAt,
      codeHash:challenge.hash,codeSalt:challenge.salt,
      selectedColumns:parsed.selectedColumns,
      shortlistBy:parsed.shortlistBy?new Date(parsed.shortlistBy):null,
    }).returning({id:shares.id});
    if(!row)throw new CompanyShareError("NOT_SHAREABLE");
    if(selectedIds.length){
      await tx.insert(selectedShares).values(selectedIds.map(applicationId=>({
        shareId:row.id,applicationId,
      })));
    }
    const event=companyShareLifecycleActivity("ISSUED",{
      organizationId:college.organizationId,collegeId:college.id,
      actorUserId:context.user.id,actorMembershipId,
      jobId:job.id,shareId:row.id,
    });
    await tx.insert(activityEvents).values({...event,metadata:{
      ...event.metadata,selectionMode:requestedIds?"EXACT_SELECTION":"CURRENT_SHORTLIST_SNAPSHOT",
      selectedCount:selectedIds.length,
      columns:parsed.selectedColumns,shortlistBy:parsed.shortlistBy,
    }});
    return {shareId:row.id,token,accessCode:challenge.code,expiresAt:expiresAt.toISOString(),
       selectedCount:selectedIds.length};
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
  const [totals]=await getDb().select({total:count()}).from(shares).where(filter);
  const total=totals?.total??0;
  const pagination=clampCompanyShareLinksPage(page,total);
  const links=await getDb().select({
      id:shares.id,expiresAt:shares.expiresAt,revokedAt:shares.revokedAt,
      createdAt:shares.createdAt,
    }).from(shares).where(filter)
      .orderBy(desc(shares.createdAt),desc(shares.id))
      .limit(COMPANY_SHARE_PAGE_SIZE).offset((pagination.page-1)*COMPANY_SHARE_PAGE_SIZE);
  const ids=links.map(link=>link.id);
  const stats=ids.length?await getDb().select({
    shareId:views.shareId,eventKind:views.eventKind,count:count(),
  }).from(views).where(and(
    eq(views.collegeId,college.id),inArray(views.shareId,ids),
  )).groupBy(views.shareId,views.eventKind):[];
  const byId=companyShareAuditTotals(stats);
  return {ready:true,page:pagination.page,total,totalPages:pagination.totalPages,links:links.map(link=>({
    ...link, audit:byId.get(link.id)??{views:0,exports:0},
  }))};
}
export async function revokeTpoCompanyApplicantShare(context: RequestContext, raw: unknown) {
  const input = companyShareRevokeSchema.parse(raw);
  const college = await tpoJob(context,input.jobId);
  if (!await companyShareTablesReady()) throw new CompanyShareError("MIGRATION_PENDING");
  return getDb().transaction(async tx=>{
    await assertPersistedPlatformPermission(tx,context,"placements.manage",{
      collegeId:college.id,organizationId:college.organizationId,
    });
    const [updated] = await tx.update(shares).set({revokedAt:new Date()})
      .where(and(eq(shares.id,input.shareId),eq(shares.collegeId,college.id),
        eq(shares.jobId,input.jobId),isNull(shares.revokedAt)))
      .returning({id:shares.id});
    // Unknown, foreign and previously-revoked ids are indistinguishable.
    if (!updated)throw new CompanyShareError("NOT_FOUND");
    await tx.insert(activityEvents).values(companyShareLifecycleActivity("REVOKED",{
      organizationId:college.organizationId,collegeId:college.id,
      actorUserId:context.user.id,actorMembershipId:context.membership!.id,
      jobId:input.jobId,shareId:updated.id,
    }));
    return {revoked:true};
  });
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
 if(!await companyShareTablesReady())return {ready:false,entries:[],limited:false,page,total:0,totalPages:1};
 const filter=and(eq(shares.collegeId,college.id),eq(shares.jobId,jobId),
  kind==="ALL"?undefined:eq(views.eventKind,kind));
 const joined=()=>getDb().select({
  shareId:views.shareId,eventKind:views.eventKind,occurredAt:views.occurredAt,
 }).from(views).innerJoin(shares,and(eq(shares.id,views.shareId),eq(shares.collegeId,views.collegeId))).where(filter);
 const [totals]=await getDb().select({total:count()}).from(views)
  .innerJoin(shares,and(eq(shares.id,views.shareId),eq(shares.collegeId,views.collegeId))).where(filter);
 const total=totals?.total??0;
 const pagination=clampCompanyShareAuditPage(page,total);
 const rows=await joined().orderBy(desc(views.occurredAt),desc(views.id))
  .limit((options.exportAll?COMPANY_SHARE_AUDIT_EXPORT_LIMIT:COMPANY_SHARE_AUDIT_PAGE_SIZE)+1)
  .offset(options.exportAll?0:(pagination.page-1)*COMPANY_SHARE_AUDIT_PAGE_SIZE);
 const limit=options.exportAll?COMPANY_SHARE_AUDIT_EXPORT_LIMIT:COMPANY_SHARE_AUDIT_PAGE_SIZE;
 return {ready:true,entries:projectCompanyShareAudit(rows.slice(0,limit)),
  page:options.exportAll?1:pagination.page,total,totalPages:pagination.totalPages,
  limited:rows.length>limit};
}
