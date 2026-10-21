import "server-only";
import {createHash,randomBytes,randomUUID,timingSafeEqual} from "node:crypto";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {db10BugReportAttachments,db10BugReports} from "@/db/schema/db10-bug-tracker";
import type {RequestContext} from "@/modules/identity/context";
import {getPrivateR2Config} from "@/modules/storage/r2-config";
import {headObject,presignUrl,getObjectStream,replaceObjectMetadata}
 from "@/modules/storage/s3-client";
import {bugScreenshotType,validateBugScreenshotUpload,
 validateBugScreenshotConfirmation,BUG_SCREENSHOT_MAX_PER_ISSUE}
 from "./access-and-attachments";
import {trackerAdminRuntimeEnabled} from "./readiness";

const publicIdSchema=z.string().regex(/^LMS-[0-9]{4,}$/).max(24);
const requestSchema=z.discriminatedUnion("action",[
 z.strictObject({action:z.literal("INITIATE"),fileName:z.string().max(255),
  contentType:z.string().max(100),sizeBytes:z.number().int().min(1).max(8*1024*1024)}),
 z.strictObject({action:z.literal("CONFIRM"),storageKey:z.string().max(700),
  fileName:z.string().max(255),uploadToken:z.string().regex(/^[a-f0-9]{64}$/)}),
]);
async function ownReport(context:RequestContext,publicId:string){
 if(context.user.platformStatus!=="ACTIVE"||!trackerAdminRuntimeEnabled())
  throw new Error("TRACKER_ATTACHMENT_UNAVAILABLE");
 const [report]=await getDb().select({
  id:db10BugReports.id,publicId:db10BugReports.publicId,
  reporterUserId:db10BugReports.reporterUserId,
 }).from(db10BugReports).where(and(
  sql`lower(${db10BugReports.publicId})=${publicId.toLowerCase()}`,
  eq(db10BugReports.reporterUserId,context.user.id))).limit(1);
 if(!report)throw new Error("TRACKER_ATTACHMENT_NOT_FOUND");
 return report;
}
function magicMatches(type:string,bytes:Uint8Array){
 if(type==="image/png")return bytes.length>=8&&
  [137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
 if(type==="image/jpeg")return bytes.length>=3&&
  bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 return bytes.length>=12&&
  String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&
  String.fromCharCode(...bytes.slice(8,12))==="WEBP";
}
async function sniffMagic(key:string,type:string){
 const response=await getObjectStream(getPrivateR2Config(),key,{start:0,end:31});
 if(!response)return false;
 const reader=response.body.getReader();
 const {value}=await reader.read();
 await reader.cancel();
 return value?magicMatches(type,value):false;
}
export async function handleOwnTrackerAttachment(context:RequestContext,
 rawId:unknown,raw:unknown){
 const publicId=publicIdSchema.parse(rawId);
 const input=requestSchema.parse(raw),report=await ownReport(context,publicId);
 if(input.action==="INITIATE"){
  const [count]=await getDb().select({total:sql<number>`count(*)::int`})
   .from(db10BugReportAttachments)
   .where(eq(db10BugReportAttachments.bugReportId,report.id));
  const allowed=validateBugScreenshotUpload({
   fileName:input.fileName,contentType:input.contentType,
   contentLength:input.sizeBytes,currentCount:count?.total??0,
  });
  const key="bug-tracker/"+report.publicId+"/"+randomUUID()+"."+allowed.extension;
  const uploadToken=randomBytes(32).toString("hex");
  const uploadHeaders={
   "content-type":allowed.contentType,
   "x-amz-meta-upload-token":uploadToken,
   "x-amz-meta-report-id":report.id,
   "x-amz-meta-reporter-user-id":context.user.id,
   "x-amz-meta-expected-size":String(input.sizeBytes),
   "x-amz-meta-malware-scan-status":"PENDING",
  };
  const uploadUrl=presignUrl(getPrivateR2Config(),{
   method:"PUT",key,expiresSeconds:900,headers:uploadHeaders,
  });
  return {action:"UPLOAD" as const,storageKey:key,uploadUrl,
   requiredHeaders:uploadHeaders,uploadToken,
   expiresAt:new Date(Date.now()+900000).toISOString()};
 }
 const existing=await getDb().select({id:db10BugReportAttachments.id})
  .from(db10BugReportAttachments)
  .where(and(eq(db10BugReportAttachments.bugReportId,report.id),
   eq(db10BugReportAttachments.storageKey,input.storageKey))).limit(1);
 if(existing[0])return {action:"CONFIRM" as const,attached:true,replayed:true};
 const prefix="bug-tracker/"+report.publicId+"/";
 if(!input.storageKey.startsWith(prefix)||input.storageKey.length>700)
  throw new Error("TRACKER_ATTACHMENT_INVALID");
 const head=await headObject(getPrivateR2Config(),input.storageKey);
 if(!head||head.metadata["report-id"]!==report.id||
    head.metadata["reporter-user-id"]!==context.user.id||
    head.metadata["expected-size"]!==String(head.sizeBytes)||
    !Number.isSafeInteger(head.sizeBytes)||
    Date.now()-head.lastModifiedMs>60*60*1000)
  throw new Error("TRACKER_ATTACHMENT_UNVERIFIED");
 const reportedToken=head.metadata["upload-token"]??"";
 const expectedHash=createHash("sha256").update(input.uploadToken).digest();
 const actualHash=createHash("sha256").update(reportedToken).digest();
 if(!timingSafeEqual(expectedHash,actualHash))
  throw new Error("TRACKER_ATTACHMENT_UNVERIFIED");
 const valid=validateBugScreenshotConfirmation({
  publicId:report.publicId,storageKey:input.storageKey,
  originalFilename:input.fileName,
  storedContentType:head.contentType,storedLength:head.sizeBytes,
  currentCount:0,
 });
 const scanner=head.metadata["scan-attested-by"]??"";
 if(head.metadata["malware-scan-status"]!=="CLEAN"||
    scanner!=="lms-vnext-privileged-scanner"){
  // Development-only visual-format attestation is not antivirus. Production
  // requires an actual privileged scanner and keeps screenshots unavailable.
  if(process.env.APP_ENV!=="development"&&process.env.APP_ENV!=="test")
   throw new Error("TRACKER_ATTACHMENT_UNVERIFIED");
  if(!await sniffMagic(input.storageKey,valid.contentType))
   throw new Error("TRACKER_ATTACHMENT_UNVERIFIED");
  await replaceObjectMetadata(getPrivateR2Config(),input.storageKey,{
   ...head.metadata,"malware-scan-status":"CLEAN",
   "scan-attested-by":"lms-vnext-dev-format-check",
  },valid.contentType);
 }
 return getDb().transaction(async tx=>{
  const [locked]=await tx.select({id:db10BugReports.id})
   .from(db10BugReports).where(and(
    eq(db10BugReports.id,report.id),
    eq(db10BugReports.reporterUserId,context.user.id)))
   .for("update").limit(1);
  if(!locked)throw new Error("TRACKER_ATTACHMENT_NOT_FOUND");
  const [duplicate]=await tx.select({id:db10BugReportAttachments.id})
   .from(db10BugReportAttachments)
   .where(eq(db10BugReportAttachments.storageKey,input.storageKey)).limit(1);
  if(duplicate)return {action:"CONFIRM" as const,attached:true,replayed:true};
  const [count]=await tx.select({total:sql<number>`count(*)::integer`})
   .from(db10BugReportAttachments)
   .where(eq(db10BugReportAttachments.bugReportId,report.id));
  if((count?.total??0)>=BUG_SCREENSHOT_MAX_PER_ISSUE)
   throw new Error("TRACKER_ATTACHMENT_LIMIT");
  const [added]=await tx.insert(db10BugReportAttachments).values({
   bugReportId:report.id,...valid,
  }).returning({id:db10BugReportAttachments.id});
  return {action:"CONFIRM" as const,attached:true,replayed:false,id:added.id};
 });
}
