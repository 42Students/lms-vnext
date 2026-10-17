import { randomBytes } from "node:crypto";
import { getDb } from "@/db/client";
import {
  db10BugReportActivities,
  db10BugReports,
  db10BugTrackerAccess,
} from "@/db/schema/db10-bug-tracker";
import { type RequestContext } from "@/modules/identity/context";
import { TrackerAdminError } from "./admin-errors";
import { trackerReportSchema } from "./report-input-model";

/**
 * SA-placements-projects-100: authenticated intake while reporter sessions
 * remain unapproved (SA-placements-projects-101 / OD-27 is intentionally SKIP).
 * The access row satisfies DB10's required reporter provenance but has no
 * issued token/session, so it cannot grant someone access to tracker reports.
 */
export async function createBugTrackerIssueForAdmin(context: RequestContext, rawInput: unknown) {
  if(context.user.platformStatus!=="ACTIVE")throw new TrackerAdminError("FORBIDDEN");
  const input = trackerReportSchema.parse(rawInput);
  const publicId = "LMS-" + randomBytes(8).readBigUInt64BE().toString().padStart(4, "0");
  const db = getDb();
  return db.transaction(async (tx) => {
    const [reporter] = await tx.insert(db10BugTrackerAccess).values({
      displayName: input.reporterName,
      tokenHash: randomBytes(32).toString("hex"),
      accessRole: "REPORTER",
      active: false,
    }).returning({ id: db10BugTrackerAccess.id });
    if (!reporter) throw new Error("Tracker reporter could not be recorded");
    const [report] = await tx.insert(db10BugReports).values({
      publicId,
      reporterAccessId: reporter.id,
      reporterUserId: context.user.id,
      collegeId: context.adminScope?.collegeId ?? null,
      reporterName: input.reporterName,
      accountRole: input.accountRole,
      environment: input.environment,
      page: input.page,
      screen: input.screen ?? null,
      section: input.section ?? null,
      issueType: input.issueType,
      description: input.description,
      severity: input.severity,
      evidenceLink: input.evidenceLink || null,
    }).returning({ id: db10BugReports.id, publicId: db10BugReports.publicId });
    if (!report) throw new Error("Tracker report could not be saved");
    await tx.insert(db10BugReportActivities).values({
      bugReportId: report.id,
      type: "CREATED",
      actorUserId: context.user.id,
      actorAccessId: null,
      actorName: input.reporterName,
    });
    return { publicId: report.publicId };
  });
}
