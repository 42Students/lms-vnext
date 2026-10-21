import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  isNull,
  lt,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges } from "@/db/schema/colleges";
import {activityEvents} from "@/db/schema/activity";
import {
  db10BugReportActivities,
  db10BugReportAttachments,
  db10BugReports,
} from "@/db/schema/db10-bug-tracker";
import {
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";
import {
  applyBugWorkflowRetest,
  applyBugWorkflowUpdate,
  type BugAffectedLayer,
  type BugRegressionTestStatus,
  type BugResolution,
  type BugRetestStatus,
  type BugStatus,
  type BugWorkflowAuditEvent,
  type BugWorkflowSnapshot,
} from "./workflow";
import {
  trackerAdminListSchema,
  trackerPublicIdSchema,
  trackerRetestSchema,
  trackerWorkflowUpdateSchema,
} from "./admin-validation";
import { TrackerAdminError } from "./admin-errors";
import {trackerActivityCursorSchema} from "./admin-detail-cursor-model";

type BugRow = typeof db10BugReports.$inferSelect;

/** Tracker logs use authenticated, identifiable accounts instead of the legacy shared
 * bcrypt-password gate. This removes an unauditable password-only bypass; do not
 * accept legacy log-view secrets in query strings or session-less requests. */
function requireTrackerAdmin(context: RequestContext) {
  if (
    context.user.platformStatus !== "ACTIVE" ||
    !isSuperAdmin(context)
  ) {
    throw new TrackerAdminError("FORBIDDEN");
  }
}

function adminScopeCondition(context: RequestContext): SQL | undefined {
  if (context.adminScope?.collegeId) {
    return eq(db10BugReports.collegeId, context.adminScope.collegeId);
  }
  if (context.adminScope?.organizationId) {
    return eq(colleges.organizationId, context.adminScope.organizationId);
  }
  return undefined;
}

function publicIdCondition(publicId: string) {
  return sql<boolean>`lower(${db10BugReports.publicId}) = ${publicId.toLowerCase()}`;
}

function snapshot(row: BugRow): BugWorkflowSnapshot {
  return {
    id: row.id,
    status: row.status as BugStatus,
    resolution: row.resolution as BugResolution | null,
    affectedLayer: row.affectedLayer as BugAffectedLayer | null,
    rootCause: row.rootCause,
    fixNotes: row.fixNotes,
    frontendCommitSha: row.frontendCommitSha,
    backendCommitSha: row.backendCommitSha,
    regressionTestStatus:
      row.regressionTestStatus as BugRegressionTestStatus,
    productionVerified: row.productionVerified,
    retestStatus: row.retestStatus as BugRetestStatus,
    retestedAt: row.retestedAt,
    version: row.version,
  };
}

function auditRows(
  events: readonly BugWorkflowAuditEvent[],
  actorUserId: string,
) {
  return events.map((event) => ({
    bugReportId: event.issueId,
    type: event.type,
    actorUserId,
    actorAccessId: null,
    actorName: null,
    fromValue: event.previous,
    toValue: event.next,
    note:
      event.note ??
      (event.changedFields.length
        ? `Changed: ${event.changedFields.join(", ")}`
        : null),
    createdAt: event.occurredAt,
  }));
}

function serializeListRow(row: BugRow) {
  return {
    id: row.id,
    publicId: row.publicId,
    collegeId: row.collegeId,
    reporterName: row.reporterName,
    accountRole: row.accountRole,
    environment: row.environment,
    page: row.page,
    screen: row.screen,
    section: row.section,
    issueType: row.issueType,
    description: row.description,
    severity: row.severity,
    status: row.status,
    resolution: row.resolution,
    retestStatus: row.retestStatus,
    productionVerified: row.productionVerified,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listBugTrackerIssuesForAdmin(
  context: RequestContext,
  rawInput: unknown,
) {
  requireTrackerAdmin(context);
  const input = trackerAdminListSchema.parse(rawInput);
  const conditions: SQL[] = [];
  const scope = adminScopeCondition(context);
  if (scope) conditions.push(scope);
  if (input.status) conditions.push(eq(db10BugReports.status, input.status));
  if (input.severity) conditions.push(eq(db10BugReports.severity, input.severity));
  if (input.accountRole) conditions.push(eq(db10BugReports.accountRole, input.accountRole));
  if (input.resolution === "UNRESOLVED") conditions.push(isNull(db10BugReports.resolution));
  else if (input.resolution) conditions.push(eq(db10BugReports.resolution, input.resolution));
  if (input.retestStatus) conditions.push(eq(db10BugReports.retestStatus, input.retestStatus));
  if (input.productionVerified !== undefined) conditions.push(eq(db10BugReports.productionVerified, input.productionVerified));
  if (input.environment) {
    conditions.push(eq(db10BugReports.environment, input.environment));
  }
  if (input.issueType) conditions.push(eq(db10BugReports.issueType, input.issueType));
  if (input.createdFrom) conditions.push(gte(db10BugReports.createdAt,input.createdFrom));
  if (input.createdBefore) conditions.push(lt(db10BugReports.createdAt,input.createdBefore));
  if(input.reporter){
    const reporter=input.reporter.toLowerCase();
    conditions.push(sql`lower(${db10BugReports.reporterName}) = ${reporter}`);
  }
  if (input.q) {
    // Literal substring semantics: '%' and '_' in user input are data, not LIKE wildcards.
    const term=input.q.toLowerCase();
    conditions.push(or(
      sql`position(${term}::text in lower(${db10BugReports.publicId})) > 0`,
      sql`position(${term}::text in lower(${db10BugReports.reporterName})) > 0`,
      sql`position(${term}::text in lower(${db10BugReports.page})) > 0`,
      sql`position(${term}::text in lower(${db10BugReports.screen})) > 0`,
      sql`position(${term}::text in lower(${db10BugReports.section})) > 0`,
      sql`position(${term}::text in lower(${db10BugReports.description})) > 0`,
    )!);
  }
  if (input.beforeCreatedAt && input.beforeId) {
    const time = input.beforeCreatedAt;
    const id = input.beforeId;
    conditions.push(
      input.sort === "newest"
        ? or(
            lt(db10BugReports.createdAt, time),
            and(eq(db10BugReports.createdAt, time), lt(db10BugReports.id, id)),
          )!
        : or(
            gt(db10BugReports.createdAt, time),
            and(eq(db10BugReports.createdAt, time), gt(db10BugReports.id, id)),
          )!,
    );
  }

  const newest = input.sort === "newest";
  const rows = await getDb()
    .select({ report: db10BugReports })
    .from(db10BugReports)
    .leftJoin(colleges, eq(colleges.id, db10BugReports.collegeId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      newest ? desc(db10BugReports.createdAt) : asc(db10BugReports.createdAt),
      newest ? desc(db10BugReports.id) : asc(db10BugReports.id),
    )
    .limit(input.limit + 1);

  const hasMore = rows.length > input.limit;
  const items = rows.slice(0, input.limit).map((row) => serializeListRow(row.report));
  const last = items[items.length - 1];
  return {
    items,
    nextCursor: hasMore && last
      ? { beforeCreatedAt: last.createdAt, beforeId: last.id }
      : null,
  };
}

export async function getBugTrackerIssueForAdmin(
  context: RequestContext,
  publicIdInput: string,
  rawCursor: unknown = {},
) {
  requireTrackerAdmin(context);
  const activityCursor = trackerActivityCursorSchema.parse(rawCursor);
  const publicId = trackerPublicIdSchema.parse(publicIdInput);
  const conditions: SQL[] = [publicIdCondition(publicId)];
  const scope = adminScopeCondition(context);
  if (scope) conditions.push(scope);

  const [row] = await getDb()
    .select({ report: db10BugReports })
    .from(db10BugReports)
    .leftJoin(colleges, eq(colleges.id, db10BugReports.collegeId))
    .where(and(...conditions))
    .limit(1);
  if (!row) throw new TrackerAdminError("ISSUE_NOT_FOUND");

  const activityConditions: SQL[] = [eq(db10BugReportActivities.bugReportId,row.report.id)];
  if (activityCursor.activityBeforeCreatedAt && activityCursor.activityBeforeId) {
    const time=activityCursor.activityBeforeCreatedAt;
    const id=activityCursor.activityBeforeId;
    activityConditions.push(or(
      lt(db10BugReportActivities.createdAt,time),
      and(eq(db10BugReportActivities.createdAt,time),lt(db10BugReportActivities.id,id)),
    )!);
  }
  const attachmentConditions: SQL[] = [eq(db10BugReportAttachments.bugReportId,row.report.id)];
  if(activityCursor.attachmentBeforeCreatedAt && activityCursor.attachmentBeforeId){
    const at=activityCursor.attachmentBeforeCreatedAt,id=activityCursor.attachmentBeforeId;
    attachmentConditions.push(or(
      lt(db10BugReportAttachments.createdAt,at),
      and(eq(db10BugReportAttachments.createdAt,at),lt(db10BugReportAttachments.id,id)),
    )!);
  }
  const [activityResult,attachmentResult] = await Promise.allSettled([
    getDb()
      .select({
        id: db10BugReportActivities.id,
        type: db10BugReportActivities.type,
        actorUserId: db10BugReportActivities.actorUserId,
        actorAccessId: db10BugReportActivities.actorAccessId,
        actorName: db10BugReportActivities.actorName,
        fromValue: db10BugReportActivities.fromValue,
        toValue: db10BugReportActivities.toValue,
        note: db10BugReportActivities.note,
        createdAt: db10BugReportActivities.createdAt,
      })
      .from(db10BugReportActivities)
      .where(and(...activityConditions))
      .orderBy(desc(db10BugReportActivities.createdAt), desc(db10BugReportActivities.id))
      .limit(51),
    getDb()
      .select({
        id: db10BugReportAttachments.id,
        originalFilename: db10BugReportAttachments.originalFilename,
        contentType: db10BugReportAttachments.contentType,
        sizeBytes: db10BugReportAttachments.sizeBytes,
        createdAt: db10BugReportAttachments.createdAt,
      })
      .from(db10BugReportAttachments)
      .where(and(...attachmentConditions))
      .orderBy(desc(db10BugReportAttachments.createdAt),desc(db10BugReportAttachments.id))
      .limit(51),
  ]);

  const activityRows=activityResult.status==="fulfilled"?activityResult.value:[];
  const attachmentRows=attachmentResult.status==="fulfilled"?attachmentResult.value:[];
  const activities=activityRows.slice(0,50);
  const attachments=attachmentRows.slice(0,50);
  const lastAttachment=attachments.at(-1);
  const last=activities.at(-1);
  // Audit the *successful* account-based view, never raw IP, headers,
  // signed media links, engineering notes or private attachment keys.
  // Persist before returning the privileged details.
  await getDb().insert(activityEvents).values({
    actorUserId:context.user.id,
    module:"PLATFORM",
    eventType:"platform.tracker.issue_viewed",
    subjectType:"bug_report",
    subjectId:row.report.id,
    summary:"Bug Tracker issue viewed",
    metadata:{publicId:row.report.publicId,access:"account"},
  });
  return { report:row.report,activities,attachments,
    activityUnavailable:activityResult.status==="rejected",
    attachmentsUnavailable:attachmentResult.status==="rejected",
    nextAttachmentCursor:attachmentRows.length>50 && lastAttachment ? {
      attachmentBeforeCreatedAt:lastAttachment.createdAt.toISOString(),attachmentBeforeId:lastAttachment.id,
    }:null,
    nextActivityCursor: activityRows.length>50 && last ? {
      activityBeforeCreatedAt:last.createdAt.toISOString(),activityBeforeId:last.id,
    }:null,
  };
}

export async function updateBugTrackerWorkflowForAdmin(
  context: RequestContext,
  publicIdInput: string,
  rawInput: unknown,
) {
  requireTrackerAdmin(context);
  const publicId = trackerPublicIdSchema.parse(publicIdInput);
  // All permitted workflow status values are validated centrally. Invalid
  // values fail closed before any row update or actor audit mutation.
  const input = trackerWorkflowUpdateSchema.parse(rawInput);
  const now = new Date();

  return getDb().transaction(async (tx) => {
    const conditions: SQL[] = [publicIdCondition(publicId)];
    const scope = adminScopeCondition(context);
    if (scope) conditions.push(scope);
    const [loaded] = await tx
      .select({ report: db10BugReports })
      .from(db10BugReports)
      .leftJoin(colleges, eq(colleges.id, db10BugReports.collegeId))
      .where(and(...conditions))
      .limit(1);
    if (!loaded) throw new TrackerAdminError("ISSUE_NOT_FOUND");

    let transition;
    try {
      transition = applyBugWorkflowUpdate(
        snapshot(loaded.report),
        input,
        { id: context.user.id, active: true, role: "SUPER_ADMIN" },
        now,
      );
    } catch (error) {
      if (error instanceof Error && error.message === "STALE_VERSION") {
        throw new TrackerAdminError("STALE_VERSION");
      }
      throw error;
    }

    if (transition.events.length === 0) return loaded.report;
    const next = transition.next;
    const [updated] = await tx
      .update(db10BugReports)
      .set({
        status: next.status,
        resolution: next.resolution,
        affectedLayer: next.affectedLayer,
        rootCause: next.rootCause,
        fixNotes: next.fixNotes,
        frontendCommitSha: next.frontendCommitSha,
        backendCommitSha: next.backendCommitSha,
        regressionTestStatus: next.regressionTestStatus,
        productionVerified: next.productionVerified,
        retestStatus: next.retestStatus,
        retestedAt: next.retestedAt,
        version: next.version,
        updatedAt: now,
      })
      .where(and(
        eq(db10BugReports.id, loaded.report.id),
        eq(db10BugReports.version, loaded.report.version),
      ))
      .returning();
    if (!updated) throw new TrackerAdminError("STALE_VERSION");

    await tx.insert(db10BugReportActivities).values(
      auditRows(transition.events, context.user.id),
    );
    return updated;
  });
}

export async function retestBugTrackerIssueForAdmin(
  context: RequestContext,
  publicIdInput: string,
  rawInput: unknown,
) {
  requireTrackerAdmin(context);
  const publicId = trackerPublicIdSchema.parse(publicIdInput);
  // applyBugWorkflowRetest preserves the legacy "Issue is not ready for
  // retest." conflict whenever the issue is not READY_FOR_RETEST.
  const input = trackerRetestSchema.parse(rawInput);
  const now = new Date();

  return getDb().transaction(async (tx) => {
    const conditions: SQL[] = [publicIdCondition(publicId)];
    const scope = adminScopeCondition(context);
    if (scope) conditions.push(scope);
    const [loaded] = await tx
      .select({ report: db10BugReports })
      .from(db10BugReports)
      .leftJoin(colleges, eq(colleges.id, db10BugReports.collegeId))
      .where(and(...conditions))
      .limit(1);
    if (!loaded) throw new TrackerAdminError("ISSUE_NOT_FOUND");

    let transition;
    try {
      transition = applyBugWorkflowRetest(
        snapshot(loaded.report),
        input,
        { id: context.user.id, active: true, role: "SUPER_ADMIN" },
        now,
      );
    } catch (error) {
      if (error instanceof Error && error.message === "STALE_VERSION") {
        throw new TrackerAdminError("STALE_VERSION");
      }
      throw error;
    }

    const next = transition.next;
    const [updated] = await tx
      .update(db10BugReports)
      .set({
        status: next.status,
        resolution: next.resolution,
        productionVerified: next.productionVerified,
        retestStatus: next.retestStatus,
        retestedAt: next.retestedAt,
        version: next.version,
        updatedAt: now,
      })
      .where(and(
        eq(db10BugReports.id, loaded.report.id),
        eq(db10BugReports.version, loaded.report.version),
      ))
      .returning();
    if (!updated) throw new TrackerAdminError("STALE_VERSION");

    await tx.insert(db10BugReportActivities).values(
      auditRows(transition.events, context.user.id),
    );
    return updated;
  });
}

/** Legacy page-number adapter for authorised tracker table clients. Modern
 * cursor listing remains unchanged and both paths enforce the same scope. */
export async function listLegacyBugTrackerIssuesForAdmin(
 context:RequestContext,input:{page:number;size:number;sort:"asc"|"desc";
  status?:string;severity?:string;environment?:string;q?:string},
){
 requireTrackerAdmin(context);
 const conditions:SQL[]=[];
 const scope=adminScopeCondition(context);
 if(scope)conditions.push(scope);
 if(input.status)conditions.push(eq(db10BugReports.status,input.status));
 if(input.severity)conditions.push(eq(db10BugReports.severity,input.severity));
 if(input.environment)conditions.push(eq(db10BugReports.environment,input.environment));
 if(input.q){
  const term=input.q.toLowerCase();
  conditions.push(or(
   sql`position(${term}::text in lower(${db10BugReports.publicId})) > 0`,
   sql`position(${term}::text in lower(${db10BugReports.description})) > 0`,
  )!);
 }
 const where=conditions.length?and(...conditions):undefined;
 const ordering=input.sort==="asc"?asc:desc;
 const [totals,found]=await Promise.all([
  getDb().select({total:count()}).from(db10BugReports)
   .leftJoin(colleges,eq(colleges.id,db10BugReports.collegeId)).where(where),
  getDb().select({report:db10BugReports}).from(db10BugReports)
   .leftJoin(colleges,eq(colleges.id,db10BugReports.collegeId)).where(where)
   .orderBy(ordering(db10BugReports.createdAt),ordering(db10BugReports.id))
   .limit(input.size).offset(input.page*input.size),
 ]);
 const total=Number(totals[0]?.total??0);
 const items=found.map(row=>serializeListRow(row.report));
 return {items,content:items,page:input.page,size:input.size,total,
  totalElements:total,totalPages:Math.ceil(total/input.size),
  number:input.page,numberOfElements:items.length,
  first:input.page===0,last:(input.page+1)*input.size>=total,
  pageable:{pageNumber:input.page,pageSize:input.size,offset:input.page*input.size}};
}
