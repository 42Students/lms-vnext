import { createHash, randomBytes } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  db10BugReportActivities,
  db10BugReports,
  db10BugTrackerAccess,
} from "@/db/schema/db10-bug-tracker";
import { users } from "@/db/schema";
import { type RequestContext } from "@/modules/identity/context";
import { TrackerAdminError } from "./admin-errors";
import { trackerReportSchema } from "./report-input-model";

/**
 * SA-placements-projects-100: authenticated intake while reporter sessions
 * remain unapproved (SA-placements-projects-101 / OD-27 is intentionally SKIP).
 * The access row satisfies DB10's required reporter provenance but has no
 * issued token/session, so it cannot grant someone access to tracker reports.
 * Reuse the authenticated actor's existing inert access key across reports;
 * a forged dropdown display name never becomes the persisted reporter identity.
 */
export async function createBugTrackerIssueForAdmin(
  context: RequestContext, rawInput: unknown, idempotencyKey?: string | null,
) {
  if(context.user.platformStatus!=="ACTIVE")throw new TrackerAdminError("FORBIDDEN");
  const input = trackerReportSchema.parse(rawInput);
  if (idempotencyKey != null &&
      !/^[a-zA-Z0-9_-]{16,128}$/.test(idempotencyKey)) {
    throw new TrackerAdminError("FORBIDDEN");
  }
  // Public IDs do not reveal a sequential DB row. A caller-supplied stable
  // retry key gets a stable public ID for the same authenticated reporter.
  // Without a key, preserve the existing cryptographically random behavior.
  const publicId = "LMS-" + (idempotencyKey
    ? createHash("sha256").update("tracker:v1:").update(context.user.id)
      .update(":").update(idempotencyKey).digest().readBigUInt64BE()
    : randomBytes(8).readBigUInt64BE()).toString().padStart(4, "0");
  const db = getDb();
  return db.transaction(async (tx) => {
    const [actor] = await tx.select({
      displayName: users.displayName,
      platformStatus: users.platformStatus,
    }).from(users).where(eq(users.id, context.user.id)).for("update").limit(1);
    if (!actor || actor.platformStatus !== "ACTIVE") {
      throw new TrackerAdminError("FORBIDDEN");
    }
    if (idempotencyKey) {
      // Locking the reporter's users row above serializes same-user retries;
      // the existing UNIQUE public_id index is the second defense.
      const [priorReport] = await tx.select({
        reporterUserId: db10BugReports.reporterUserId,
        accountRole: db10BugReports.accountRole,
        environment: db10BugReports.environment,
        page: db10BugReports.page,
        screen: db10BugReports.screen,
        section: db10BugReports.section,
        issueType: db10BugReports.issueType,
        description: db10BugReports.description,
        severity: db10BugReports.severity,
        status: db10BugReports.status,
      }).from(db10BugReports)
        .where(eq(db10BugReports.publicId, publicId)).limit(1);
      if (priorReport) {
        if (priorReport.reporterUserId !== context.user.id ||
            priorReport.accountRole !== input.accountRole ||
            priorReport.environment !== input.environment ||
            priorReport.page !== input.page ||
            (priorReport.screen ?? null) !== (input.screen ?? null) ||
            (priorReport.section ?? null) !== (input.section ?? null) ||
            priorReport.issueType !== input.issueType ||
            priorReport.description !== input.description ||
            priorReport.severity !== input.severity) {
          throw new TrackerAdminError("FORBIDDEN");
        }
        return { publicId, status: priorReport.status,
          reporterAccess: "ACCOUNT_ONLY" as const };
      }
    }
    const reporterName = actor.displayName.trim() || "Authenticated reporter";
    // Historic bug tracker allowed selecting an active named reporter, but
    // names are not identities and may collide. User IDs are authoritative.
    // Existing rows are re-used so reporting does not create a new disabled
    // principal on every submission. No external login token is issued.
    const [existingAccess]=await tx.select({id:db10BugTrackerAccess.id})
      .from(db10BugTrackerAccess)
      .where(eq(db10BugTrackerAccess.subjectUserId,context.user.id)).limit(1);
    const [prior] = await tx.select({ id: db10BugReports.reporterAccessId })
      .from(db10BugReports).where(eq(db10BugReports.reporterUserId, context.user.id))
      .orderBy(desc(db10BugReports.createdAt)).limit(1);
    const reporter = existingAccess ?? prior ?? (await tx.insert(db10BugTrackerAccess).values({
      subjectUserId:context.user.id,
      displayName: reporterName,
      tokenHash: randomBytes(32).toString("hex"),
      accessRole: "REPORTER",
      active: false,
    }).returning({ id: db10BugTrackerAccess.id }))[0];
    if (!reporter) throw new Error("Tracker reporter could not be recorded");
    if(prior && !existingAccess){
      await tx.update(db10BugTrackerAccess)
        .set({subjectUserId:context.user.id})
        .where(eq(db10BugTrackerAccess.id,prior.id));
    }
    const [report] = await tx.insert(db10BugReports).values({
      publicId,
      reporterAccessId: reporter.id,
      reporterUserId: context.user.id,
      collegeId: context.adminScope?.collegeId ?? null,
      reporterName,
      accountRole: input.accountRole,
      environment: input.environment,
      page: input.page,
      screen: input.screen ?? null,
      section: input.section ?? null,
      issueType: input.issueType,
      description: input.description,
      severity: input.severity,
      evidenceLink: input.evidenceLink || null,
      sourceUrl: input.sourceUrl || null,
      sourcePath: input.sourcePath || null,
      browser: input.browser || null,
      viewport: input.viewport || null,
    }).returning({ id: db10BugReports.id, publicId: db10BugReports.publicId });
    if (!report) throw new Error("Tracker report could not be saved");
    await tx.insert(db10BugReportActivities).values({
      bugReportId: report.id,
      type: "CREATED",
      actorUserId: context.user.id,
      actorAccessId: null,
      actorName: reporterName,
    });
    return { publicId: report.publicId, status: "NEW" as const,
      reporterAccess: "ACCOUNT_ONLY" as const };
  });
}
