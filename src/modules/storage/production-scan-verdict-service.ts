import "server-only";

import {createHash} from "node:crypto";
import {and,eq,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {
 assignmentSubmissionFiles,projectResourceFiles,lessonVideoAssets,
} from "@/db/schema/storage-files";
import {PRODUCTION_SCANNER_ID} from "./file-lifecycle";
import {normalizeContentType} from "./file-policy";
import {getPrivateR2Config} from "./r2-config";
import {headObject} from "./s3-client";

/** Merely configuring R2 cannot authorize public downloads. A separately
 * operated scanning worker must attest bytes and be deployed/verified.
 * APP_ENV is mandatory; a missing value fails closed like production. */
export function productionScannerCallbackReady(env:NodeJS.ProcessEnv=process.env){
 const secret=env.PRIVATE_STORAGE_SCANNER_WEBHOOK_SECRET?.trim()??"";
 return env.APP_ENV==="production"&&
  env.PRIVATE_STORAGE_SCANNER_READY==="PROD_VERIFIED"&&
  secret.length>=32 && !/[\x00-\x20\x7f]/.test(secret);
}

export const productionScanVerdictSchema=z.strictObject({
 kind:z.enum(["ASSIGNMENT_SUBMISSION_FILE","PROJECT_RESOURCE_FILE","LESSON_VIDEO"]),
 fileId:z.string().uuid(),
 collegeId:z.string().uuid(),
 generation:z.string().regex(/^[0-9]{1,20}$/),
 verdict:z.enum(["CLEAN","REJECTED"]),
 /** Worker-owned scan digest, never copied from the upload caller. */
 sha256Hex:z.string().regex(/^[a-f0-9]{64}$/).nullish(),
 completedAt:z.iso.datetime(),
}).superRefine((row,ctx)=>{
 if(row.verdict==="CLEAN"&&!row.sha256Hex){
  ctx.addIssue({code:"custom",path:["sha256Hex"],message:"Scan digest required"});
 }
});

type ScanVerdict=z.infer<typeof productionScanVerdictSchema>;

type ScanRecord={
 id:string;collegeId:string;ownerMembershipId:string;objectKey:string;
 objectGeneration:string|null;status:string;scanStatus:string;
 uploadExpiresAt:Date;
 uploadTokenHash:string;verifiedContentType:string|null;
 verifiedSizeBytes:number|null;deletedAt:Date|null;
 scanAttestedBy:string|null;
};

/** A scanned object must be the same immutable generation and owner that the
 * browser upload confirmation inspected. No caller-supplied URL is accepted.
 * The scanner itself must fetch the object privately and verify malware
 * before sending CLEAN; this endpoint never performs malware detection. */
async function validateScannedObject(row:ScanRecord){
 const object=await headObject(getPrivateR2Config(),row.objectKey);
 if(!object||String(object.lastModifiedMs)!==row.objectGeneration||
  object.metadata["owner-membership-id"]!==row.ownerMembershipId||
  object.metadata["college-id"]!==row.collegeId||
  object.metadata["malware-scan-status"]!=="PENDING"||
  typeof object.metadata["upload-token"]!=="string"||
  createHash("sha256").update(object.metadata["upload-token"]).digest("hex")!==row.uploadTokenHash||
  row.verifiedSizeBytes!==object.sizeBytes||
  row.verifiedContentType!==normalizeContentType(object.contentType))
  throw new Error("SCAN_SOURCE_CHANGED");
}

/**
 * Apply a verified malware scanner verdict via generation+tenant-scoped CAS.
 * Clean artifacts become usable only after this privileged callback and
 * existing READY/scanStatus/CLEAN DB checks; rejected files remain blocked.
 * Replays of the same CLEAN verdict are idempotent, not a second promotion.
 */
export async function applyProductionScanVerdict(raw:unknown){
 if(!productionScannerCallbackReady())throw new Error("SCANNER_NOT_READY");
 const input:ScanVerdict=productionScanVerdictSchema.parse(raw);
 const when=Date.parse(input.completedAt);
 const now=Date.now();
 if(!Number.isFinite(when)||when<now-15*60_000||when>now+5*60_000)
  throw new Error("SCAN_VERDICT_EXPIRED");
 const db=getDb();
 let row:ScanRecord|undefined;
 if(input.kind==="ASSIGNMENT_SUBMISSION_FILE"){
  const [candidate]=await db.select({
   id:assignmentSubmissionFiles.id,collegeId:assignmentSubmissionFiles.collegeId,
   ownerMembershipId:assignmentSubmissionFiles.ownerMembershipId,
   objectKey:assignmentSubmissionFiles.objectKey,
   objectGeneration:assignmentSubmissionFiles.objectGeneration,
   uploadExpiresAt:assignmentSubmissionFiles.uploadExpiresAt,
   status:assignmentSubmissionFiles.status,scanStatus:assignmentSubmissionFiles.scanStatus,
   uploadTokenHash:assignmentSubmissionFiles.uploadTokenHash,
   verifiedContentType:assignmentSubmissionFiles.verifiedContentType,
   verifiedSizeBytes:assignmentSubmissionFiles.verifiedSizeBytes,
   deletedAt:assignmentSubmissionFiles.deletedAt,
   scanAttestedBy:assignmentSubmissionFiles.scanAttestedBy,
  }).from(assignmentSubmissionFiles).where(and(
   eq(assignmentSubmissionFiles.id,input.fileId),
   eq(assignmentSubmissionFiles.collegeId,input.collegeId),
  )).limit(1);
  row=candidate;
 }else if(input.kind==="PROJECT_RESOURCE_FILE"){
  const [candidate]=await db.select({
   id:projectResourceFiles.id,collegeId:projectResourceFiles.collegeId,
   ownerMembershipId:projectResourceFiles.uploaderMembershipId,
   objectKey:projectResourceFiles.objectKey,
   objectGeneration:projectResourceFiles.objectGeneration,
   uploadExpiresAt:projectResourceFiles.uploadExpiresAt,
   status:projectResourceFiles.status,scanStatus:projectResourceFiles.scanStatus,
   uploadTokenHash:projectResourceFiles.uploadTokenHash,
   verifiedContentType:projectResourceFiles.verifiedContentType,
   verifiedSizeBytes:projectResourceFiles.verifiedSizeBytes,
   deletedAt:projectResourceFiles.deletedAt,
   scanAttestedBy:projectResourceFiles.scanAttestedBy,
  }).from(projectResourceFiles).where(and(
   eq(projectResourceFiles.id,input.fileId),eq(projectResourceFiles.collegeId,input.collegeId),
  )).limit(1);
  row=candidate;
 }else{
  const [candidate]=await db.select({
   id:lessonVideoAssets.id,collegeId:lessonVideoAssets.collegeId,
   ownerMembershipId:lessonVideoAssets.uploaderMembershipId,
   objectKey:lessonVideoAssets.objectKey,
   objectGeneration:lessonVideoAssets.objectGeneration,
   uploadExpiresAt:lessonVideoAssets.uploadExpiresAt,
   status:lessonVideoAssets.processingStatus,scanStatus:lessonVideoAssets.scanStatus,
   uploadTokenHash:lessonVideoAssets.uploadTokenHash,
   verifiedContentType:lessonVideoAssets.verifiedContentType,
   verifiedSizeBytes:lessonVideoAssets.verifiedSizeBytes,
   deletedAt:lessonVideoAssets.deletedAt,
   scanAttestedBy:lessonVideoAssets.scanAttestedBy,
  }).from(lessonVideoAssets).where(and(
   eq(lessonVideoAssets.id,input.fileId),eq(lessonVideoAssets.collegeId,input.collegeId),
  )).limit(1);
  // R2 object and scanner receipt must have a real college membership owner.
  if(!candidate?.ownerMembershipId)throw new Error("SCAN_RECORD_NOT_FOUND");
  // Preserve the refined non-null membership in the object type; database
  // inference remains nullable because platform uploader rows may exist.
  row={...candidate,ownerMembershipId:candidate.ownerMembershipId};
 }
 if(!row||row.deletedAt||row.objectGeneration!==input.generation)
  throw new Error("SCAN_RECORD_NOT_FOUND");
 if(row.scanStatus===input.verdict&&row.scanAttestedBy===PRODUCTION_SCANNER_ID&&
    (row.status==="READY"||row.status==="QUARANTINED"||row.status==="BLOCKED"))
  return {accepted:true,changed:false,scanStatus:row.scanStatus};
 if(row.status!==(input.kind==="LESSON_VIDEO"?"PROCESSING":"VERIFYING")||
    row.scanStatus!=="PENDING")throw new Error("SCAN_STATE_CHANGED");
 // A valid presigned PUT can overwrite the scanned object until expiry.
 // Do not release CLEAN bytes while the original browser upload capability
 // is still usable; add a minute for clock skew. Reject verdicts can be
 // quarantined immediately, because those rows cannot issue read grants.
 if(input.verdict==="CLEAN"){
  const safeAfter=row.uploadExpiresAt.getTime()+60_000;
  if(Date.now()<safeAfter)throw new Error("UPLOAD_GRANT_STILL_ACTIVE");
  if(when<safeAfter)throw new Error("SCAN_PERFORMED_BEFORE_UPLOAD_GRANT_EXPIRED");
 }
 await validateScannedObject(row);
 const clean=input.verdict==="CLEAN";
 const at=new Date();
 if(input.kind==="ASSIGNMENT_SUBMISSION_FILE"){
  const [updated]=await db.update(assignmentSubmissionFiles).set({
   status:clean?"READY":"QUARANTINED",scanStatus:clean?"CLEAN":"REJECTED",
   scanAttestedAt:at,scanAttestedBy:PRODUCTION_SCANNER_ID,
   sha256Hex:clean?input.sha256Hex:null,
   completedAt:clean?at:null,
   failureCode:clean?null:"STORAGE_CONTENT_REJECTED",updatedAt:at,
  }).where(and(
   eq(assignmentSubmissionFiles.id,input.fileId),eq(assignmentSubmissionFiles.collegeId,input.collegeId),
   eq(assignmentSubmissionFiles.objectGeneration,input.generation),
   eq(assignmentSubmissionFiles.status,"VERIFYING"),
   eq(assignmentSubmissionFiles.scanStatus,"PENDING"),
   isNull(assignmentSubmissionFiles.deletedAt),
  )).returning({id:assignmentSubmissionFiles.id});
  if(!updated)throw new Error("SCAN_STATE_CHANGED");
 }else if(input.kind==="PROJECT_RESOURCE_FILE"){
  const [updated]=await db.update(projectResourceFiles).set({
   status:clean?"READY":"QUARANTINED",scanStatus:clean?"CLEAN":"REJECTED",
   scanAttestedAt:at,scanAttestedBy:PRODUCTION_SCANNER_ID,
   sha256Hex:clean?input.sha256Hex:null,
   completedAt:clean?at:null,
   failureCode:clean?null:"STORAGE_CONTENT_REJECTED",updatedAt:at,
  }).where(and(
   eq(projectResourceFiles.id,input.fileId),eq(projectResourceFiles.collegeId,input.collegeId),
   eq(projectResourceFiles.objectGeneration,input.generation),
   eq(projectResourceFiles.status,"VERIFYING"),
   eq(projectResourceFiles.scanStatus,"PENDING"),isNull(projectResourceFiles.deletedAt),
  )).returning({id:projectResourceFiles.id});
  if(!updated)throw new Error("SCAN_STATE_CHANGED");
 }else{
  const [updated]=await db.update(lessonVideoAssets).set({
   processingStatus:clean?"READY":"BLOCKED",scanStatus:clean?"CLEAN":"REJECTED",
   scanAttestedAt:at,scanAttestedBy:PRODUCTION_SCANNER_ID,
   completedAt:clean?at:null,
   failureCode:clean?null:"STORAGE_CONTENT_REJECTED",updatedAt:at,
  }).where(and(
   eq(lessonVideoAssets.id,input.fileId),eq(lessonVideoAssets.collegeId,input.collegeId),
   eq(lessonVideoAssets.objectGeneration,input.generation),
   eq(lessonVideoAssets.processingStatus,"PROCESSING"),
   eq(lessonVideoAssets.scanStatus,"PENDING"),isNull(lessonVideoAssets.deletedAt),
  )).returning({id:lessonVideoAssets.id});
  if(!updated)throw new Error("SCAN_STATE_CHANGED");
 }
 return {accepted:true,changed:true,scanStatus:input.verdict};
}
