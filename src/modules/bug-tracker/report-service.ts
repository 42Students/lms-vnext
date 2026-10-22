import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
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
 * Reporter enrollment is tied to an ACTIVE platform identity. The reporter
 * principal is recorded for provenance only: no bearer secret or tracker
 * session is returned or issued. A previously disabled reporter remains
 * disabled; re-enabling revoked access requires the dedicated admin process.
 * Authenticated bug intake remains available through its own role boundary,
 * and the actor cannot select someone else's reporter identity.
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
  const db=getDb();
  // Retry only a collision on the public-id unique index, using a fresh
  // transaction. PostgreSQL aborts a transaction after a unique violation.
  for(let attempt=0;attempt<3;attempt++){
   const publicId="LMS-"+(idempotencyKey
    ? createHash("sha256").update("tracker:v1:").update(context.user.id)
      .update(":").update(idempotencyKey).digest().readBigUInt64BE()
    : randomBytes(8).readBigUInt64BE()).toString().padStart(4,"0");
   if(publicId.length>24)throw new TrackerAdminError("INVALID_INPUT");
   try{
    return await db.transaction(async (tx) => {
    const [actor] = await tx.select({
      displayName: users.displayName,
      platformStatus: users.platformStatus,
    }).from(users).where(eq(users.id, context.user.id)).for("update").limit(1);
    if (!actor || actor.platformStatus !== "ACTIVE") {
      throw new TrackerAdminError("FORBIDDEN");
    }
    // Persisted principal revocation takes priority over idempotent replay:
    // no stale user can re-enable a disabled reporter by submitting a report.
    const [existingAccess]=await tx.select({
      id:db10BugTrackerAccess.id,active:db10BugTrackerAccess.active,
      accessRole:db10BugTrackerAccess.accessRole,
    }).from(db10BugTrackerAccess)
      .where(eq(db10BugTrackerAccess.subjectUserId,context.user.id))
      .for("update").limit(1);
    if (existingAccess && (!existingAccess.active ||
        !["REPORTER","MANAGER"].includes(existingAccess.accessRole)))
      throw new TrackerAdminError("FORBIDDEN");
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
    const reporterName=actor.displayName.trim();
    // Names can collide. The immutable user ID is the sole identity key,
    // and only the signed-in user may submit their own selected reporter name.
    if(!reporterName||input.reporterName.trim().toLocaleLowerCase("en-IN")!==reporterName.toLocaleLowerCase("en-IN"))
      throw new TrackerAdminError("INVALID_INPUT");
    // Historic display names are not identities. Only an ACTIVE access row
    // belonging to the signed-in user can be reused. Never claim an older
    // report's access ID; imported access may have been revoked.
    const reporter = existingAccess ?? (await tx.insert(db10BugTrackerAccess).values({
      subjectUserId:context.user.id,
      displayName: reporterName,
      tokenHash: randomBytes(32).toString("hex"),
      accessRole: "REPORTER",
      // Newly authenticated reporters can have a real, user-bound active
      // reporter principal. The random token hash is never returned, so this
      // does not grant access to any legacy bearer-token login endpoint.
      active: true,
    }).returning({ id: db10BugTrackerAccess.id }))[0];
    if (!reporter) throw new Error("Tracker reporter could not be recorded");
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
      sourceUrl:input.sourceUrl?(()=>{
        // Browser URLs may contain auth tokens or private query parameters.
        const safe=new URL(input.sourceUrl);
        safe.username="";safe.password="";safe.search="";safe.hash="";
        return safe.toString();
      })():null,
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
   }catch(error){
    const candidate=error as {code?:string;constraint?:string;cause?:{code?:string;constraint?:string}};
    const code=candidate.code??candidate.cause?.code;
    const constraint=candidate.constraint??candidate.cause?.constraint;
    if(idempotencyKey||code!=="23505"||constraint!=="db10_bug_reports_public_id_uq")throw error;
   }
  }
  throw new TrackerAdminError("INVALID_INPUT");
}
