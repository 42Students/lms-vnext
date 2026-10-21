import "server-only";

import { and, asc, eq, exists, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { projectInstances, projectResourceFiles, projectResources } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { authorizeOrNotFound } from "@/modules/storage/file-access";
import { planCompletion } from "@/modules/storage/file-completion";
import { recordStorageFileEvent } from "@/modules/storage/file-events";
import { StorageFileError } from "@/modules/storage/file-errors";
import {
  FILE_READ_TTL_SECONDS,
  issueObjectReadUrl,
  issueObjectUpload,
  removeStoredObject,
  verifyUploadedObject,
} from "@/modules/storage/file-lifecycle";
import {
  MAX_PROJECT_FILES_PER_PROJECT,
  validateStorageDeclaration,
} from "@/modules/storage/file-policy";
import { requireProjectLifecycleAccess, requireProjectReadAccess } from "./access";
import { projectResourceIdSchema } from "./validation";

type FileRow = typeof projectResourceFiles.$inferSelect;

const idSchema = z.string().uuid();

export const projectFileUploadInputSchema = z
  .object({
    originalName: z.string().max(255),
    contentType: z.string().max(128),
    sizeBytes: z.number().int(),
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(4000).nullable().optional(),
    resourceId: projectResourceIdSchema.nullable().optional(),
  })
  .strict();
export type ProjectFileUploadInput = z.infer<typeof projectFileUploadInputSchema>;

export const projectFileUpdateInputSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(4000).nullable().optional(),
  })
  .strict()
  .refine((value) => value.title !== undefined || value.description !== undefined, {
    message: "Nothing to update",
  });
export type ProjectFileUpdateInput = z.infer<typeof projectFileUpdateInputSchema>;

export function toProjectFileDto(row: FileRow) {
  return {
    id: row.id,
    projectId: row.projectId,
    resourceId: row.resourceId,
    title: row.title,
    description: row.description,
    originalName: row.originalName,
    contentType: row.verifiedContentType ?? row.declaredContentType,
    sizeBytes: row.verifiedSizeBytes ?? row.declaredSizeBytes,
    status: row.status as "UPLOADING" | "VERIFYING" | "READY" | "QUARANTINED" | "FAILED" | "DELETED",
    failureCode: row.failureCode,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}
export type ProjectFileDto = ReturnType<typeof toProjectFileDto>;

function requireOpenProject(status: string) {
  if (status === "ARCHIVED" || status === "COMPLETED") {
    throw new StorageFileError("STORAGE_PARENT_NOT_AVAILABLE");
  }
}

function requireUploaderMembership(context: RequestContext, collegeId: string) {
  const membership = context.membership;
  if (
    !membership ||
    membership.status !== "ACTIVE" ||
    membership.collegeId !== collegeId ||
    context.user.platformStatus !== "ACTIVE"
  ) {
    throw new StorageFileError("STORAGE_UPLOADER_MEMBERSHIP_REQUIRED");
  }
  return membership;
}

async function loadFile(projectId: string, fileId: string) {
  const [row] = await getDb()
    .select()
    .from(projectResourceFiles)
    .where(
      and(
        eq(projectResourceFiles.id, idSchema.parse(fileId)),
        eq(projectResourceFiles.projectId, projectId),
      ),
    )
    .limit(1);
  if (!row) throw new StorageFileError("STORAGE_NOT_FOUND");
  return row;
}

/** Mentor or admin: validates the declaration and returns a presigned PUT. */
export async function issueProjectFileUploadGrant(
  context: RequestContext,
  projectIdInput: string,
  rawInput: ProjectFileUploadInput,
) {
  const input = projectFileUploadInputSchema.parse(rawInput);
  const declaration = validateStorageDeclaration("project-resource", input);
  if (!declaration.ok) throw new StorageFileError(declaration.code);

  const scope = await authorizeOrNotFound(() => requireProjectReadAccess(context, projectIdInput));
  if(!["LEARNER","MENTOR","ADMIN"].includes(scope.access))throw new StorageFileError("STORAGE_NOT_FOUND");
  if(scope.access==="LEARNER" && scope.project.status!=="ACTIVE")
    throw new StorageFileError("STORAGE_PARENT_NOT_AVAILABLE");
  requireOpenProject(scope.project.status);
  const uploader = requireUploaderMembership(context, scope.collegeId);

  if (input.resourceId) {
    const [resource] = await getDb()
      .select({ id: projectResources.id, status: projectResources.status, visibility:projectResources.visibility })
      .from(projectResources)
      .where(and(eq(projectResources.id, input.resourceId), eq(projectResources.projectId, scope.project.id)))
      .limit(1);
    if (!resource || resource.status !== "ACTIVE" || (scope.access==="LEARNER"&&resource.visibility!=="TEAM")) throw new StorageFileError("STORAGE_NOT_FOUND");
  }

  const grant = await issueObjectUpload({
    collegeId: scope.collegeId,
    ownerMembershipId: uploader.id,
    kind: "project-resource",
    contentType: declaration.value.contentType,
    sizeBytes: declaration.value.sizeBytes,
  });

  const row = await getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`prf:${scope.project.id}`}, 0))`);
    const [project] = await tx
      .select({ status: projectInstances.status })
      .from(projectInstances)
      .where(eq(projectInstances.id, scope.project.id))
      .for("share")
      .limit(1);
    if (!project) throw new StorageFileError("STORAGE_NOT_FOUND");
    requireOpenProject(project.status);
    const [{ count }] = (await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(projectResourceFiles)
      .where(
        and(
          eq(projectResourceFiles.projectId, scope.project.id),
          inArray(projectResourceFiles.status, ["UPLOADING", "VERIFYING", "READY"]),
        ),
      )) as [{ count: number }];
    if (count >= MAX_PROJECT_FILES_PER_PROJECT) {
      throw new StorageFileError("STORAGE_FILE_LIMIT_REACHED");
    }
    const [created] = await tx
      .insert(projectResourceFiles)
      .values({
        collegeId: scope.collegeId,
        projectId: scope.project.id,
        resourceId: input.resourceId ?? null,
        uploaderMembershipId: uploader.id,
        title: input.title ?? (declaration.value.originalName.replace(/\.[^.]+$/, "").slice(0, 200) || "Resource"),
        description: input.description ?? null,
        objectKey: grant.objectKey,
        uploadTokenHash: grant.uploadTokenHash,
        uploadExpiresAt: grant.expiresAt,
        originalName: declaration.value.originalName,
        declaredContentType: declaration.value.contentType,
        declaredSizeBytes: declaration.value.sizeBytes,
        createdByUserId: context.user.id,
      })
      .returning();
    await recordStorageFileEvent(tx, context, {
      collegeId: scope.collegeId,
      subjectKind: "PROJECT_RESOURCE_FILE",
      subjectId: created!.id,
      eventType: "UPLOAD_GRANTED",
      detail: { sizeBytes: declaration.value.sizeBytes, contentType: declaration.value.contentType },
    });
    return created!;
  });

  return {
    file: toProjectFileDto(row),
    grant: {
      fileId: row.id,
      method: grant.method,
      uploadUrl: grant.uploadUrl,
      expiresAt: grant.expiresAt,
      requiredHeaders: grant.requiredHeaders,
      originalName: row.originalName,
    },
  };
}

/** Mentor or admin: confirms the PUT finished; verifies and (non-production) attests. */
export async function completeProjectFileUpload(
  context: RequestContext,
  projectIdInput: string,
  fileIdInput: string,
) {
  const scope = await authorizeOrNotFound(() => requireProjectReadAccess(context, projectIdInput));
  if(!["LEARNER","MENTOR","ADMIN"].includes(scope.access))
    throw new StorageFileError("STORAGE_NOT_FOUND");
  const row = await loadFile(scope.project.id, fileIdInput);
  if(scope.access==="LEARNER" && (row.uploaderMembershipId!==context.membership?.id ||
    scope.project.status!=="ACTIVE"))
    throw new StorageFileError("STORAGE_NOT_FOUND");
  if (row.status === "READY") return toProjectFileDto(row);
  // A manager cannot finalize an in-flight upload after the workspace is archived.
  requireOpenProject(scope.project.status);
  if (row.status !== "UPLOADING" && row.status !== "VERIFYING") {
    throw new StorageFileError("STORAGE_INVALID_STATE");
  }

  const outcome = await verifyUploadedObject({
    objectKey: row.objectKey,
    collegeId: row.collegeId,
    ownerMembershipId: row.uploaderMembershipId,
    kind: "project-resource",
    declaredContentType: row.declaredContentType,
    declaredSizeBytes: row.declaredSizeBytes,
    uploadTokenHash: row.uploadTokenHash,
  });
  const plan = planCompletion(outcome, new Date());

  if (plan.kind === "WAIT") {
    // Another completion may have won after this request read its stale row.
    const raced = await loadFile(scope.project.id, row.id);
    if (raced.status === "READY") return toProjectFileDto(raced);
    if (row.uploadExpiresAt.getTime() + 60_000 < Date.now()) {
      const expiredOrWinner = await getDb().transaction(async tx=>{
        const [liveProject] = await tx.select({status:projectInstances.status})
          .from(projectInstances).where(eq(projectInstances.id,scope.project.id))
          .for("share").limit(1);
        if(!liveProject)throw new StorageFileError("STORAGE_NOT_FOUND");
        requireOpenProject(liveProject.status);
        const [failed] = await tx.update(projectResourceFiles)
          .set({status:"FAILED",failureCode:"STORAGE_UPLOAD_EXPIRED",updatedAt:new Date()})
          .where(and(eq(projectResourceFiles.id,row.id),
            eq(projectResourceFiles.projectId,scope.project.id),
            eq(projectResourceFiles.status,row.status)))
          .returning();
        if(failed)return failed;
        // A parallel verifier may have committed READY between our first
        // reread and this expired-state CAS. Never report failed when it won.
        const [winner]=await tx.select().from(projectResourceFiles)
          .where(and(eq(projectResourceFiles.id,row.id),
            eq(projectResourceFiles.projectId,scope.project.id))).limit(1);
        return winner??null;
      });
      if(expiredOrWinner?.status==="READY")return toProjectFileDto(expiredOrWinner);
      throw new StorageFileError("STORAGE_UPLOAD_EXPIRED");
    }
    throw new StorageFileError("STORAGE_UPLOAD_NOT_FOUND");
  }

  const updated = await getDb().transaction(async (tx) => {
    const [liveProject] = await tx.select({ status: projectInstances.status }).from(projectInstances)
      .where(eq(projectInstances.id, scope.project.id)).for("share").limit(1);
    if (!liveProject) throw new StorageFileError("STORAGE_NOT_FOUND");
    requireOpenProject(liveProject.status);
    const [next] = await tx
      .update(projectResourceFiles)
      .set({ status: plan.status, ...plan.fields, sha256Hex: plan.sha256Hex, updatedAt: new Date() })
      .where(
        and(eq(projectResourceFiles.id, row.id), inArray(projectResourceFiles.status, ["UPLOADING", "VERIFYING"])),
      )
      .returning();
    if (!next) {
      // The row-level compare-and-swap prevents a second completion from
      // writing another audit event. A READY winner is an idempotent success.
      const [winner] = await tx.select().from(projectResourceFiles).where(and(
        eq(projectResourceFiles.id,row.id),eq(projectResourceFiles.projectId,scope.project.id),
      )).limit(1);
      if (winner?.status === "READY") return {row:winner, changed:false};
      throw new StorageFileError("STORAGE_INVALID_STATE");
    }
    await recordStorageFileEvent(tx, context, {
      collegeId: row.collegeId,
      subjectKind: "PROJECT_RESOURCE_FILE",
      subjectId: row.id,
      eventType: plan.event,
      detail: { status: plan.status, failureCode: plan.fields.failureCode },
    });
    if (plan.status === "READY") {
      await recordStorageFileEvent(tx, context, {
        collegeId: row.collegeId,
        subjectKind: "PROJECT_RESOURCE_FILE",
        subjectId: row.id,
        eventType: "SCAN_ATTESTED",
        detail: { attestedBy: plan.fields.scanAttestedBy },
      });
    }
    return {row:next, changed:true};
  });
  if (!updated.changed) return toProjectFileDto(updated.row);
  if (plan.deleteObject) {
    // The transaction has already persisted QUARANTINED/FAILED. Preserve
    // that non-readable state even when object-store cleanup is unavailable.
    try { await removeStoredObject(row.objectKey); }
    catch { /* Unreadable DB state is authoritative; retry cleanup separately. */ }
  }
  if (plan.status === "QUARANTINED") throw new StorageFileError("STORAGE_CONTENT_REJECTED");
  if (plan.status === "FAILED") throw new StorageFileError("STORAGE_UPLOAD_MISMATCH");
  return toProjectFileDto(updated.row);
}

/**
 * Project members see verified files only; mentors and admins also see files
 * that are still uploading or failed so they can retry.
 */
export async function listProjectFiles(context: RequestContext, projectIdInput: string) {
  const scope = await authorizeOrNotFound(() => requireProjectReadAccess(context, projectIdInput));
  const manager = scope.access === "ADMIN" || scope.access === "MENTOR";
  const rows = await getDb()
    .select()
    .from(projectResourceFiles)
    .where(
      and(
        eq(projectResourceFiles.projectId, scope.project.id),
        // Treat the college scope as a separate invariant from the project FK.
        eq(projectResourceFiles.collegeId, scope.collegeId),
        manager ? ne(projectResourceFiles.status, "DELETED") : eq(projectResourceFiles.status, "READY"),
        manager ? undefined : or(
          isNull(projectResourceFiles.resourceId),
          exists(getDb().select({id:projectResources.id})
            .from(projectResources).where(and(
              eq(projectResources.id,projectResourceFiles.resourceId),
              eq(projectResources.projectId,scope.project.id),
              eq(projectResources.status,"ACTIVE"),
              eq(projectResources.visibility,"TEAM"),
            ))),
        ),
      ),
    )
    .orderBy(asc(projectResourceFiles.createdAt));
  return rows.map(toProjectFileDto);
}

export async function updateProjectFileDetails(
  context: RequestContext,
  projectIdInput: string,
  fileIdInput: string,
  rawInput: ProjectFileUpdateInput,
) {
  const input = projectFileUpdateInputSchema.parse(rawInput);
  const scope = await authorizeOrNotFound(() => requireProjectLifecycleAccess(context, projectIdInput));
  requireOpenProject(scope.project.status);
  const row = await loadFile(scope.project.id, fileIdInput);
  if (row.status === "DELETED") throw new StorageFileError("STORAGE_NOT_FOUND");
  const updated = await getDb().transaction(async (tx) => {
    const [liveProject] = await tx.select({ status: projectInstances.status }).from(projectInstances)
      .where(eq(projectInstances.id, scope.project.id)).for("share").limit(1);
    if (!liveProject) throw new StorageFileError("STORAGE_NOT_FOUND");
    requireOpenProject(liveProject.status);
    const [next] = await tx
      .update(projectResourceFiles)
      .set({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(projectResourceFiles.id, row.id), eq(projectResourceFiles.projectId,scope.project.id), ne(projectResourceFiles.status, "DELETED")))
      .returning();
    if (!next) throw new StorageFileError("STORAGE_NOT_FOUND");
    await recordStorageFileEvent(tx, context, {
      collegeId: row.collegeId,
      subjectKind: "PROJECT_RESOURCE_FILE",
      subjectId: row.id,
      eventType: "UPDATED",
    });
    return next;
  });
  return toProjectFileDto(updated);
}

/** Soft delete (row kept for audit); the object is removed best-effort. */
export async function removeProjectFile(
  context: RequestContext,
  projectIdInput: string,
  fileIdInput: string,
) {
  const scope = await authorizeOrNotFound(() => requireProjectLifecycleAccess(context, projectIdInput));
  requireOpenProject(scope.project.status);
  const row = await loadFile(scope.project.id, fileIdInput);
  if (row.status === "DELETED") return toProjectFileDto(row);
  const updated = await getDb().transaction(async (tx) => {
    const [liveProject] = await tx.select({ status: projectInstances.status }).from(projectInstances)
      .where(eq(projectInstances.id, scope.project.id)).for("share").limit(1);
    if (!liveProject) throw new StorageFileError("STORAGE_NOT_FOUND");
    requireOpenProject(liveProject.status);
    const [next] = await tx
      .update(projectResourceFiles)
      .set({ status: "DELETED", deletedAt: new Date(), deletedByUserId: context.user.id, updatedAt: new Date() })
      .where(and(eq(projectResourceFiles.id, row.id), eq(projectResourceFiles.projectId,scope.project.id), ne(projectResourceFiles.status, "DELETED")))
      .returning();
    if (!next) {
      const [winner] = await tx.select().from(projectResourceFiles).where(and(
        eq(projectResourceFiles.id,row.id),eq(projectResourceFiles.projectId,scope.project.id),
      )).limit(1);
      if (winner?.status === "DELETED") return {row:winner, changed:false};
      throw new StorageFileError("STORAGE_INVALID_STATE");
    }
    await recordStorageFileEvent(tx, context, {
      collegeId: row.collegeId,
      subjectKind: "PROJECT_RESOURCE_FILE",
      subjectId: row.id,
      eventType: "DELETED",
    });
    return {row:next, changed:true};
  });
  if (!updated.changed) return toProjectFileDto(updated.row);
  // The soft-delete transaction already revoked application download access.
  // Object-store outages must not turn that committed, idempotent deletion
  // into a false failed response; retain the deleted row for cleanup/audit.
  try { await removeStoredObject(row.objectKey); }
  catch { /* A retrying storage janitor can remove the orphaned object. */ }
  return toProjectFileDto(updated.row);
}

/** Download grant for any project member (or admin) who can read the project. POST because it audits. */
export async function issueProjectFileDownloadGrant(
  context: RequestContext,
  projectIdInput: string,
  fileIdInput: string,
  options: { disposition?: "inline" | "attachment" } = {},
) {
  const scope = await authorizeOrNotFound(() => requireProjectReadAccess(context, projectIdInput));
  const row = await loadFile(scope.project.id, fileIdInput);
  // A malformed or incorrectly migrated file row must not grant access across tenants.
  if (row.collegeId !== scope.collegeId) throw new StorageFileError("STORAGE_NOT_FOUND");
  if (row.status === "DELETED") throw new StorageFileError("STORAGE_NOT_FOUND");
  const manager = scope.access === "ADMIN" || scope.access === "MENTOR";
  if(row.resourceId && !manager){
    // Never issue a signed URL when a linked resource is mentor-only, even if
    // a caller bypasses the Resources page and guesses a stored file UUID.
    const [linked]=await getDb().select({visibility:projectResources.visibility,status:projectResources.status})
      .from(projectResources).where(and(eq(projectResources.id,row.resourceId),
        eq(projectResources.projectId,scope.project.id))).limit(1);
    if(!linked||linked.status!=="ACTIVE"||linked.visibility!=="TEAM")
      throw new StorageFileError("STORAGE_NOT_FOUND");
  }
  if (row.status !== "READY" && !manager) throw new StorageFileError("STORAGE_NOT_FOUND");
  if (
    row.status !== "READY" ||
    row.scanStatus !== "CLEAN" ||
    !row.objectGeneration ||
    row.verifiedSizeBytes === null ||
    !row.verifiedContentType
  ) {
    throw new StorageFileError("STORAGE_FILE_NOT_READY");
  }
  // Revalidate persisted verified metadata at the final signed-read boundary:
  // imported/corrupt rows must not bypass the project resource MIME/size and
  // safe filename rules merely because an earlier upload marked them READY.
  const verifiedDeclaration = validateStorageDeclaration("project-resource", {
    originalName: row.originalName,
    contentType: row.verifiedContentType,
    sizeBytes: row.verifiedSizeBytes,
  });
  if (!verifiedDeclaration.ok) throw new StorageFileError("STORAGE_FILE_NOT_READY");
  if (row.declaredSizeBytes !== verifiedDeclaration.value.sizeBytes ||
      row.declaredContentType !== verifiedDeclaration.value.contentType) {
    throw new StorageFileError("STORAGE_FILE_NOT_READY");
  }
  const disposition =
    options.disposition === "inline" && /^(application\/pdf|image\/(png|jpeg|webp))$/.test(row.verifiedContentType)
      ? "inline"
      : "attachment";
  const grant = await issueObjectReadUrl(
    {
      objectKey: row.objectKey,
      collegeId: row.collegeId,
      ownerMembershipId: row.uploaderMembershipId,
      generation: row.objectGeneration,
      sizeBytes: row.verifiedSizeBytes,
      contentType: row.verifiedContentType,
    },
    { ttlSeconds: FILE_READ_TTL_SECONDS, maxTtlSeconds: 15 * 60, disposition, fileName: row.originalName },
  );
  await recordStorageFileEvent(getDb(), context, {
    collegeId: row.collegeId,
    subjectKind: "PROJECT_RESOURCE_FILE",
    subjectId: row.id,
    eventType: "DOWNLOAD_GRANTED",
    detail: { disposition },
  });
  return {
    url: grant.url,
    expiresAt: grant.expiresAt.toISOString(),
    expiresInSeconds: grant.expiresInSeconds,
    file: toProjectFileDto(row),
  };
}
