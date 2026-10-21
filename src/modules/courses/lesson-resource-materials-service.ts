import "server-only";

import {and,asc,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {lessonContents} from "@/db/schema";
import {lessonContentMaterials} from "@/db/schema/lesson-content-materials";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
import {requireDeliveryContentMutation,requireLearningReadAccess} from "./learning-access";
import {loadLessonContentScope} from "./scope";
import {CoursesServiceError} from "./errors";
import {createPrivateReadGrant} from "@/modules/storage/private-object-storage";
import {StorageFileError} from "@/modules/storage/file-errors";
import {resourceMaterialCommandSchema,resourceMaterialsWriteReady,safeLearnerResourceMaterialHref} from "./lesson-resource-materials-model";

function ensureReady(){
 if(!resourceMaterialsWriteReady())throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");
}
async function authorizeMaterial(context:RequestContext,contentId:string,deliveryId:string|null,write:boolean){
 const content=await loadLessonContentScope(contentId);
 if(content.contentType!=="RESOURCE")throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");
 if(content.deliveryId&&content.deliveryId!==deliveryId)
  throw new CoursesServiceError("CONTENT_DELIVERY_MISMATCH");
 if(write){
  if(content.deliveryId)await requireDeliveryContentMutation(context,content.deliveryId);
  else if(!can(context,"courses.manage",{collegeId:content.collegeId,organizationId:content.organizationId}))
   throw new CoursesServiceError("LEARNING_ACCESS_DENIED");
 }else{
  const role=await requireLearningReadAccess(context,content.offeringId,deliveryId);
  if(role==="LEARNER"&&(content.status!=="PUBLISHED"||content.learningPathStatus!=="PUBLISHED"||!content.lessonVisibleToStudents||!content.visibleToStudents))
   throw new CoursesServiceError("LESSON_CONTENT_NOT_PUBLISHED");
 }
 return content;
}
export async function listLessonResourceMaterials(
 context:RequestContext,contentId:string,deliveryId:string|null,
){
 ensureReady();
 await authorizeMaterial(context,contentId,deliveryId,false);
 const rows=await getDb().select({
  id:lessonContentMaterials.id,title:lessonContentMaterials.title,
  notes:lessonContentMaterials.notes,kind:lessonContentMaterials.kind,
  externalUrl:lessonContentMaterials.externalUrl,
  originalName:lessonContentMaterials.originalName,
  mimeType:lessonContentMaterials.mimeType,
  sizeBytes:lessonContentMaterials.sizeBytes,
  sequence:lessonContentMaterials.sequence,
  uploadStatus:lessonContentMaterials.uploadStatus,
 }).from(lessonContentMaterials).where(eq(lessonContentMaterials.lessonContentId,contentId))
  .orderBy(asc(lessonContentMaterials.sequence));
 // FILE rows never disclose opaque object keys; a separate auth-scoped signed
 // download-grant endpoint will serve only verified/clean READY materials.
 // Historical imported LINK rows bypassed today's authoring validation: never
 // hand their unsafe raw href to a learner or staff client's navigation layer.
 return rows.map(row=>row.kind==="LINK"
  ? {...row,externalUrl:safeLearnerResourceMaterialHref(row.externalUrl)}
  : row);
}
export async function commandLessonResourceMaterial(
 context:RequestContext,contentId:string,deliveryId:string|null,rawInput:unknown,
){
 ensureReady();
 const input=resourceMaterialCommandSchema.parse(rawInput);
 const content=await authorizeMaterial(context,contentId,deliveryId,true);
 return getDb().transaction(async tx=>{
  const [locked]=await tx.select({id:lessonContents.id,status:lessonContents.status})
   .from(lessonContents).where(and(eq(lessonContents.id,contentId),eq(lessonContents.contentType,"RESOURCE")))
   .for("update").limit(1);
  if(!locked||locked.status==="ARCHIVED")throw new CoursesServiceError("LESSON_CONTENT_NOT_FOUND");
  async function recordAudit(id:string,action:string){
   await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.COURSES_LESSON_MATERIAL_UPDATED,
    collegeId:content.collegeId,organizationId:content.organizationId,
    subjectType:"lesson_content",subjectId:contentId,
    summary:"Resource material "+action.toLowerCase(),
    metadata:{materialId:id,kind:"LINK",deliveryId},
   });
  }
  const rows=await tx.select({id:lessonContentMaterials.id,kind:lessonContentMaterials.kind,
    externalUrl:lessonContentMaterials.externalUrl,sequence:lessonContentMaterials.sequence})
   .from(lessonContentMaterials).where(eq(lessonContentMaterials.lessonContentId,contentId))
   .orderBy(asc(lessonContentMaterials.sequence));
  if(input.action==="ADD_LINK"){
   if(rows.length>=20)throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");
   if(rows.some(row=>row.externalUrl?.toLowerCase()===input.externalUrl.toLowerCase()))
    throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");
   const [created]=await tx.insert(lessonContentMaterials).values({
    lessonContentId:contentId,kind:"LINK",title:input.title,notes:input.notes,
    externalUrl:input.externalUrl,sequence:rows.length?Math.max(...rows.map(x=>x.sequence))+1:0,
    createdByUserId:context.user.id,uploadStatus:"READY",
   }).returning({id:lessonContentMaterials.id});
   await recordAudit(created!.id,input.action);
   return {id:created!.id,action:input.action};
  }
  const old=rows.find(row=>row.id===input.materialId);
  if(!old||old.kind!=="LINK")throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");
  if(input.action==="EDIT_LINK"){
   if(rows.some(row=>row.id!==old.id&&row.externalUrl?.toLowerCase()===input.externalUrl.toLowerCase()))
    throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");
   await tx.update(lessonContentMaterials).set({
    title:input.title,notes:input.notes,externalUrl:input.externalUrl,updatedAt:new Date(),
   }).where(and(eq(lessonContentMaterials.id,old.id),eq(lessonContentMaterials.lessonContentId,contentId)));
  }else{
   await tx.delete(lessonContentMaterials).where(and(
    eq(lessonContentMaterials.id,old.id),eq(lessonContentMaterials.lessonContentId,contentId)));
  }
  await recordAudit(old.id,input.action);
  return {id:old.id,action:input.action};
 });
}


/**
 * Migration-only compatibility projection of legacy ContentDataDTO materials.
 * The old JSON allowed both camelCase and snake_case fields. A legacy FILE
 * cannot simply be copied into READY: its original R2 key belongs to the old
 * storage namespace and has no vNext clean-scan attestation. Re-import it
 * through the private file upload/verification flow before enabling Open.
 *
 * Legacy index is an immutable migration identity: seed sequence=index and
 * never compact sequences when removing a material.
 */
export type LegacyResourceMaterialDraft = {
  legacyIndex: number;
  kind: "LINK" | "FILE";
  title: string;
  notes: string | null;
  externalUrl: string | null;
  needsVerifiedFileImport: boolean;
};

export function parseLegacyResourceMaterialDrafts(value: unknown): LegacyResourceMaterialDraft[] {
  let data = value;
  if (typeof data === "string") {
    try { data = JSON.parse(data) as unknown; } catch { return []; }
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  const parent = data as Record<string, unknown>;
  const dto = parent.contentDataDTO ?? parent.content_data_dto ?? parent;
  if (!dto || typeof dto !== "object" || Array.isArray(dto)) return [];
  const record = dto as Record<string, unknown>;
  const rawMaterials = record.resourceMaterials ?? record.resource_materials;
  if (!Array.isArray(rawMaterials)) return [];
  return rawMaterials.flatMap((raw, index): LegacyResourceMaterialDraft[] => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const item = raw as Record<string, unknown>;
    const kind = String(item.kind ?? "").toUpperCase();
    if (kind !== "LINK" && kind !== "FILE") return [];
    const rawTitle = item.title ?? item.file_name ?? item.fileName ?? "Resource material";
    const title = String(rawTitle).trim().slice(0, 255) || "Resource material";
    const rawNotes = item.notes;
    const notes = typeof rawNotes === "string" ? rawNotes.slice(0, 2000) : null;
    const rawUrl = item.url ?? item.externalUrl ?? item.external_url;
    const externalUrl = kind === "LINK" && typeof rawUrl === "string"
      ? safeLearnerResourceMaterialHref(rawUrl) : null;
    // Reject malformed imported links; never turn a historic object key
    // into an external link visible to students.
    if (kind === "LINK" && !externalUrl) return [];
    return [{
      legacyIndex: index, kind, title, notes, externalUrl,
      needsVerifiedFileImport: kind === "FILE",
    }];
  });
}

/**
 * A legacy /materials/{index} link can resolve to the vNext UUID without
 * embedding an object key or exposing another content's materials. Historical
 * index equals the material's original sequence, never its array position
 * after removals; ADD_LINK assigns max(sequence)+1, so gaps are preserved.
 */
export async function resolveLegacyResourceMaterialId(
 context: RequestContext, contentId: string, deliveryId: string | null,
 rawIndex: number,
): Promise<string | null> {
 if (!Number.isSafeInteger(rawIndex) || rawIndex < 0)
  throw new StorageFileError("STORAGE_NOT_FOUND");
 await authorizeMaterial(context, contentId, deliveryId, false);
 const [row] = await getDb().select({id: lessonContentMaterials.id})
  .from(lessonContentMaterials)
  .where(and(eq(lessonContentMaterials.lessonContentId, contentId),
   eq(lessonContentMaterials.sequence, rawIndex)))
  .limit(1);
 return row?.id ?? null;
}

/**
 * Call ONLY on a user-initiated file Open. The material list is metadata-only.
 * The UUID and delivery go through the same authorization boundary as list.
 * R2 signs for 15 minutes, after READY and clean scanner attestation. No
 * storage key is returned, persisted in browser state, or placed in a log.
 */
export async function grantLessonResourceMaterialFile(
 context: RequestContext, contentId: string, deliveryId: string | null,
 materialId: string,
): Promise<{
 url: string;
 expiresAt: string;
 expiresInSeconds: number;
 originalName: string;
 contentType: string;
}> {
 ensureReady();
 const content = await authorizeMaterial(context, contentId, deliveryId, false);
 const [material] = await getDb().select({
  id: lessonContentMaterials.id,
  kind: lessonContentMaterials.kind,
  storageKey: lessonContentMaterials.storageKey,
  originalName: lessonContentMaterials.originalName,
  uploadStatus: lessonContentMaterials.uploadStatus,
  scanStatus: lessonContentMaterials.scanStatus,
  objectGeneration: lessonContentMaterials.objectGeneration,
  verifiedSizeBytes: lessonContentMaterials.verifiedSizeBytes,
 }).from(lessonContentMaterials).where(and(
  eq(lessonContentMaterials.id, materialId),
  eq(lessonContentMaterials.lessonContentId, contentId),
 )).limit(1);
 if (!material || material.kind !== "FILE") throw new StorageFileError("STORAGE_NOT_FOUND");
 if (material.uploadStatus !== "READY" || material.scanStatus !== "CLEAN" ||
  !material.objectGeneration || !material.verifiedSizeBytes || !material.storageKey)
  throw new StorageFileError("STORAGE_FILE_NOT_READY");

 const pieces = material.storageKey.split("/");
 const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 if (pieces.length !== 5 || pieces[0] !== "private" ||
  pieces[1] !== content.collegeId || !uuid.test(pieces[2] ?? "") ||
  pieces[3] !== "course-resource" || !uuid.test(pieces[4] ?? ""))
  throw new StorageFileError("STORAGE_NOT_FOUND");
 let grant: Awaited<ReturnType<typeof createPrivateReadGrant>>;
 try {
  grant = await createPrivateReadGrant({
   objectKey: material.storageKey,
   collegeId: content.collegeId,
   ownerMembershipId: pieces[2]!,
   expiresInMs: 15 * 60_000,
  });
 } catch {
  throw new StorageFileError("STORAGE_FILE_NOT_READY");
 }
 if (grant.generation !== material.objectGeneration ||
  grant.sizeBytes !== material.verifiedSizeBytes)
  throw new StorageFileError("STORAGE_FILE_NOT_READY");
 return {
  url: grant.readUrl,
  expiresAt: grant.expiresAt.toISOString(),
  expiresInSeconds: 15 * 60,
  originalName: material.originalName ?? "Resource file",
  contentType: grant.contentType,
 };
}
