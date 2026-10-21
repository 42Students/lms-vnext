import {NextResponse} from "next/server";
import {and,eq,sql} from "drizzle-orm";
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
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{
 params:Promise<{publicId:string;attachmentId:string}>;
}){
 try{
  const {publicId:rawId,attachmentId:rawAttachment}=await params;
  const publicId=trackerPublicIdSchema.parse(rawId);
  const attachmentId=z.string().uuid().parse(rawAttachment);
  const context=await getCurrentRequestContext();
  // SA acting-college scope is checked by the admin reader; non-admins may
  // view only screenshots attached to their own persisted reporterUserId.
  if(isSuperAdmin(context))await getBugTrackerIssueForAdmin(context,publicId);
  else await getMyTrackerReport(context,publicId);
  const [row]=await getDb().select({
   key:db10BugReportAttachments.storageKey,
   type:db10BugReportAttachments.contentType,
  }).from(db10BugReportAttachments)
   .innerJoin(db10BugReports,eq(db10BugReports.id,db10BugReportAttachments.bugReportId))
   .where(and(eq(db10BugReportAttachments.id,attachmentId),
    sql`lower(${db10BugReports.publicId})=${publicId.toLowerCase()}`))
   .limit(1);
  if(!row||!["image/png","image/jpeg","image/webp"].includes(row.type)||
     !row.key.startsWith("bug-tracker/"+publicId+"/"))
   return NextResponse.json({error:"SCREENSHOT_NOT_FOUND"},{status:404});
  const head=await headObject(getPrivateR2Config(),row.key);
  const trusted=head?.metadata["malware-scan-status"]==="CLEAN"&&(
    head?.metadata["scan-attested-by"]==="lms-vnext-privileged-scanner"||
    (process.env.APP_ENV==="development"&&
     head?.metadata["scan-attested-by"]==="lms-vnext-dev-format-check"));
  if(!head||!trusted||head.contentType!==row.type)
   return NextResponse.json({error:"SCREENSHOT_NOT_AVAILABLE"},{status:404});
  const signed=presignUrl(getPrivateR2Config(),{
   method:"GET",key:row.key,expiresSeconds:120,
  });
  return NextResponse.redirect(signed,{status:302,headers:{
   "Cache-Control":"private, no-store","Referrer-Policy":"no-referrer",
  }});
 }catch(error){return apiErrorResponse(error);}
}
