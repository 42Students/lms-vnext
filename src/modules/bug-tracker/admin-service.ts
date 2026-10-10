import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  lt,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges } from "@/db/schema/colleges";
import {
  db10BugReportActivities,
  db10BugReportAttachments,
  db10BugReports,
} from "@/db/schema/db10-bug-tracker.draft";
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

type BugRow = typeof db10BugReports.$inferSelect;

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
  if (input.environment) {
    conditions.push(eq(db10BugReports.environment, input.environment));
  }
  if (input.q) {
    const pattern = `%${input.q}%`;
    conditions.push(or(
      ilike(db10BugReports.publicId, pattern),
      ilike(db10BugReports.reporterName, pattern),
      ilike(db10BugReports.page, pattern),
      ilike(db10BugReports.description, pattern),
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
) {
  requireTrackerAdmin(context);
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

  const [activities, attachments] = await Promise.all([
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
      .where(eq(db10BugReportActivities.bugReportId, row.report.id))
      .orderBy(asc(db10BugReportActivities.createdAt), asc(db10BugReportActivities.id)),
    getDb()
      .select({
        id: db10BugReportAttachments.id,
        originalFilename: db10BugReportAttachments.originalFilename,
        contentType: db10BugReportAttachments.contentType,
        sizeBytes: db10BugReportAttachments.sizeBytes,
        createdAt: db10BugReportAttachments.createdAt,
      })
      .from(db10BugReportAttachments)
      .where(eq(db10BugReportAttachments.bugReportId, row.report.id))
      .orderBy(asc(db10BugReportAttachments.createdAt)),
  ]);

  return { report: row.report, activities, attachments };
}

export async function updateBugTrackerWorkflowForAdmin(
  context: RequestContext,
  publicIdInput: string,
  rawInput: unknown,
) {
  requireTrackerAdmin(context);
  const publicId = trackerPublicIdSchema.parse(publicIdInput);
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
