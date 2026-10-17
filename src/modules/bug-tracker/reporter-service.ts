import {and,desc,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {db10BugReports} from "@/db/schema/db10-bug-tracker";
import type {RequestContext} from "@/modules/identity/context";
import {TrackerAdminError} from "./admin-errors";
import {trackerPublicIdSchema} from "./admin-validation";

function requireReporter(context:RequestContext){
  if(context.user.platformStatus!=="ACTIVE")throw new TrackerAdminError("FORBIDDEN");
}
/** SA-placements-projects-101: never use untrusted reporter_name or account role to authorize. */
export async function listMyTrackerReports(context:RequestContext){
  requireReporter(context);
  const rows=await getDb().select({
    publicId:db10BugReports.publicId,
    description:db10BugReports.description,
    issueType:db10BugReports.issueType,
    status:db10BugReports.status,
    severity:db10BugReports.severity,
    page:db10BugReports.page,
    createdAt:db10BugReports.createdAt,
  }).from(db10BugReports)
    .where(eq(db10BugReports.reporterUserId,context.user.id))
    .orderBy(desc(db10BugReports.createdAt),desc(db10BugReports.id)).limit(50);
  return rows;
}
export async function getMyTrackerReport(context:RequestContext,rawPublicId:string){
  requireReporter(context);
  const publicId=trackerPublicIdSchema.parse(rawPublicId);
  const [report]=await getDb().select({
    publicId:db10BugReports.publicId,
    description:db10BugReports.description,
    issueType:db10BugReports.issueType,
    status:db10BugReports.status,
    severity:db10BugReports.severity,
    page:db10BugReports.page,
    environment:db10BugReports.environment,
    createdAt:db10BugReports.createdAt,
    updatedAt:db10BugReports.updatedAt,
  }).from(db10BugReports).where(and(
    eq(db10BugReports.reporterUserId,context.user.id),
    sql`lower(${db10BugReports.publicId})=${publicId.toLowerCase()}`,
  )).limit(1);
  if(!report)throw new TrackerAdminError("ISSUE_NOT_FOUND");
  return report;
}
