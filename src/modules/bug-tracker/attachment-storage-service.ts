import "server-only";
import {randomUUID} from "node:crypto";
import {and,count,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {db10BugReportAttachments,db10BugReports} from "@/db/schema/db10-bug-tracker";
import type {RequestContext} from "@/modules/identity/context";
import {getBugTrackerIssueForAdmin} from "./admin-service";
import {validateBugScreenshotConfirmation,validateBugScreenshotUpload} from "./access-and-attachments";
import {getPrivateR2Config} from "@/modules/storage/r2-config";
import {headObject,presignUrl} from "@/modules/storage/s3-client";

const uploadSchema=z.strictObject({
 fileName:z.string().min(1).max(255),
 contentType:z.string().min(1).max(100),
 contentLength:z.number().int().positive().max(8*1024*1024),
});
const confirmSchema=z.strictObject({
 storageKey:z.string().min(10).max(700),
 originalFilename:z.string().min(1).max(255),
});
/** Only an authorized SA (including acting-college scope) can issue grants
 * for the exact issue; no public bearer URL or client scan verdict is trusted. */
export async function presignTrackerAttachment(
 context:RequestContext,publicId:string,raw:unknown,
){
 const issue=await getBugTrackerIssueForAdmin(context,publicId);
 const input=uploadSchema.parse(raw);
 const [{total}]=await getDb().select({total:count()})
  .from(db10BugReportAttachments)
  .where(eq(db10BugReportAttachments.bugReportId,issue.report.id));
 const {originalFilename,contentType,extension}=validateBugScreenshotUpload({
  ...input,currentCount:total,
 });
 const key="bug-tracker/"+issue.report.publicId+"/"+randomUUID()+"."+extension;
 const expiresAt=new Date(Date.now()+10*60*1000);
 const requiredHeaders={"content-type":contentType,
  "x-amz-meta-malware-scan-status":"PENDING",
  "x-amz-meta-expected-size":String(input.contentLength)};
 const uploadUrl=presignUrl(getPrivateR2Config(),{
   method:"PUT",key,expiresSeconds:600,headers:requiredHeaders,
 });
 return {storageKey:key,originalFilename,uploadUrl,expiresAt:expiresAt.toISOString(),
  method:"PUT" as const,requiredHeaders};
}
/** Signed object confirmation is serialized by the parent issue row lock.
 * CLEAN must be attributed to the trusted scanner, not to request JSON.
 * Duplicate confirms of the same key are safe retries. */
export async function confirmTrackerAttachment(
 context:RequestContext,publicId:string,raw:unknown,
){
 const issue=await getBugTrackerIssueForAdmin(context,publicId);
 const input=confirmSchema.parse(raw);
 const head=await headObject(getPrivateR2Config(),input.storageKey);
 if(!head||head.metadata["malware-scan-status"]!=="CLEAN"||
   head.metadata["scan-attested-by"]!=="lms-vnext-privileged-scanner"||
   !/^[a-f0-9]{64}$/.test(head.metadata.sha256??""))
  throw new Error("TRACKER_ATTACHMENT_NOT_ATTESTED");
 const db=getDb();
 return db.transaction(async tx=>{
   const [locked]=await tx.select({id:db10BugReports.id}).from(db10BugReports)
     .where(eq(db10BugReports.id,issue.report.id)).for("update").limit(1);
   if(!locked)throw new Error("TRACKER_ISSUE_NOT_FOUND");
   const [existing]=await tx.select().from(db10BugReportAttachments).where(and(
     eq(db10BugReportAttachments.bugReportId,locked.id),
     eq(db10BugReportAttachments.storageKey,input.storageKey))).limit(1);
   if(existing)return {attachment:existing,replayed:true};
   const [{total}]=await tx.select({total:count()}).from(db10BugReportAttachments)
     .where(eq(db10BugReportAttachments.bugReportId,locked.id));
   const valid=validateBugScreenshotConfirmation({
      publicId:issue.report.publicId,storageKey:input.storageKey,
      originalFilename:input.originalFilename,storedContentType:head.contentType,
      storedLength:head.sizeBytes,currentCount:total,
   });
   const [row]=await tx.insert(db10BugReportAttachments).values({
     bugReportId:locked.id,...valid,
   }).onConflictDoNothing().returning();
   if(!row)throw new Error("TRACKER_ATTACHMENT_STALE");
   return {attachment:row,replayed:false};
 });
}
export async function listTrackerAttachments(context:RequestContext,publicId:string){
 const issue=await getBugTrackerIssueForAdmin(context,publicId);
 return getDb().select({id:db10BugReportAttachments.id,
   filename:db10BugReportAttachments.originalFilename,
   contentType:db10BugReportAttachments.contentType,
   sizeBytes:db10BugReportAttachments.sizeBytes,
   createdAt:db10BugReportAttachments.createdAt,
 }).from(db10BugReportAttachments)
  .where(eq(db10BugReportAttachments.bugReportId,issue.report.id))
  .orderBy(db10BugReportAttachments.createdAt).limit(3);
}
