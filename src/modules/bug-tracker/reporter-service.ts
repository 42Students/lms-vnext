import {and,desc,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {db10BugReports,db10BugReportActivities,db10BugReportAttachments} from "@/db/schema/db10-bug-tracker";
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
    screen:db10BugReports.screen,
    section:db10BugReports.section,
    evidenceLink:db10BugReports.evidenceLink,
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

/** A reporter may read only their own issue's public-status history.
 * Engineering notes, actor identifiers and private file object keys stay admin-only.
 * The ownership predicate is included in each read rather than inferred from a
 * caller-provided report identifier.
 */
export async function listMyTrackerReportHistory(context:RequestContext,rawPublicId:string){
  requireReporter(context);
  const publicId=trackerPublicIdSchema.parse(rawPublicId);
  return getDb().select({
    id:db10BugReportActivities.id,
    type:db10BugReportActivities.type,
    fromValue:db10BugReportActivities.fromValue,
    toValue:db10BugReportActivities.toValue,
    createdAt:db10BugReportActivities.createdAt,
  }).from(db10BugReportActivities)
    .innerJoin(db10BugReports,eq(db10BugReports.id,db10BugReportActivities.bugReportId))
    .where(and(eq(db10BugReports.reporterUserId,context.user.id),
      sql`lower(${db10BugReports.publicId})=${publicId.toLowerCase()}`))
    .orderBy(desc(db10BugReportActivities.createdAt),desc(db10BugReportActivities.id)).limit(50);
}

/** A reporter's own screenshot filenames and sizes, never storage keys or
 * unrestricted signed-download URLs.
 */
export async function listMyTrackerReportScreenshots(context:RequestContext,rawPublicId:string){
  requireReporter(context);
  const publicId=trackerPublicIdSchema.parse(rawPublicId);
  return getDb().select({
    id:db10BugReportAttachments.id,
    originalFilename:db10BugReportAttachments.originalFilename,
    contentType:db10BugReportAttachments.contentType,
    sizeBytes:db10BugReportAttachments.sizeBytes,
    createdAt:db10BugReportAttachments.createdAt,
  }).from(db10BugReportAttachments)
    .innerJoin(db10BugReports,eq(db10BugReports.id,db10BugReportAttachments.bugReportId))
    .where(and(eq(db10BugReports.reporterUserId,context.user.id),
      sql`lower(${db10BugReports.publicId})=${publicId.toLowerCase()}`))
    .orderBy(desc(db10BugReportAttachments.createdAt),desc(db10BugReportAttachments.id)).limit(50);
}
