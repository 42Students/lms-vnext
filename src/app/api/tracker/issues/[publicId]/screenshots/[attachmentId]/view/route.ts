import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {and,eq,sql} from "drizzle-orm";
import {colleges} from "@/db/schema/colleges";
import {z} from "zod";
import {getDb} from "@/db/client";
import {getCurrentRequestContext} from "@/auth/request-context";
import {db10BugReports,db10BugReportAttachments} from "@/db/schema/db10-bug-tracker";
import {isSuperAdmin} from "@/modules/identity/context";
import {getBugTrackerIssueForAdmin} from "@/modules/bug-tracker/admin-service";
import {getMyTrackerReport} from "@/modules/bug-tracker/reporter-service";
import {trackerPublicIdSchema} from "@/modules/bug-tracker/admin-validation";
import {getPrivateR2Config} from "@/modules/storage/r2-config";
import {headObject,presignUrl} from "@/modules/storage/s3-client";
import {apiErrorResponse} from "@/lib/api-error";
import {canSignBugScreenshotDownload} from "@/modules/bug-tracker/access-and-attachments";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const {publicId:rawId,attachmentId:rawAttachment}=params;
    const publicId=trackerPublicIdSchema.parse(rawId);
    const attachmentId=z.string().uuid().parse(rawAttachment);
    const superAdmin=isSuperAdmin(context);
    if(superAdmin)await getBugTrackerIssueForAdmin(context,publicId);
  else await getMyTrackerReport(context,publicId);
    const rowScope=superAdmin
   ? context.adminScope?.collegeId
     ? eq(db10BugReports.collegeId,context.adminScope.collegeId)
     : context.adminScope?.organizationId
       ? eq(colleges.organizationId,context.adminScope.organizationId)
       : undefined
   : eq(db10BugReports.reporterUserId,context.user.id);
    const [row]=await getDb().select({
   key:db10BugReportAttachments.storageKey,
   type:db10BugReportAttachments.contentType,
   sizeBytes:db10BugReportAttachments.sizeBytes,
   storedPublicId:db10BugReports.publicId,
  }).from(db10BugReportAttachments)
   .innerJoin(db10BugReports,eq(db10BugReports.id,db10BugReportAttachments.bugReportId))
   .leftJoin(colleges,eq(colleges.id,db10BugReports.collegeId))
   .where(and(eq(db10BugReportAttachments.id,attachmentId),
    sql`lower(${db10BugReports.publicId})=${publicId.toLowerCase()}`,rowScope))
   .limit(1);
    if(!row)
   return NextResponse.json({error:"SCREENSHOT_NOT_FOUND"},{status:404});
    const head=await headObject(getPrivateR2Config(),row.key);
    if(!canSignBugScreenshotDownload({
    publicId:row.storedPublicId,storageKey:row.key,
    contentType:row.type,sizeBytes:row.sizeBytes,
   },head,process.env["APP_ENV"]))
   return NextResponse.json({error:"SCREENSHOT_NOT_AVAILABLE"},{status:404});
    const signed=presignUrl(getPrivateR2Config(),{
   method:"GET",key:row.key,expiresSeconds:120,
  });
    return NextResponse.redirect(signed,{status:302,headers:{
   "Cache-Control":"private, no-store","Referrer-Policy":"no-referrer",
  }});
  },
);
