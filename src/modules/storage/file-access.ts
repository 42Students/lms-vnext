import "server-only";

import { CoursesServiceError } from "@/modules/courses/errors";
import { AuthorizationError } from "@/modules/permissions/policy";
import { ProjectsServiceError } from "@/modules/projects/errors";
import { StorageFileError } from "./file-errors";
import { issueObjectReadUrl, legacyFileReadOptions, type LegacyFileReadMode, type ReadableObject } from "./file-lifecycle";

/**
 * Runs an authorization or scope lookup and converts every access denial into
 * STORAGE_NOT_FOUND, so a caller cannot tell "exists but forbidden" from
 * "does not exist" (non-leaking denials for read and grant endpoints).
 */
export async function authorizeOrNotFound<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (
      error instanceof CoursesServiceError ||
      error instanceof ProjectsServiceError ||
      error instanceof AuthorizationError
    ) {
      throw new StorageFileError("STORAGE_NOT_FOUND");
    }
    throw error;
  }
}

/** A legacy filename is only a display name. Resolve and authorize its
 * resource row BEFORE passing the immutable object reference into this grant.
 * This preserves download/get/stream while never reintroducing public buckets.
 */
export async function authorizeLegacyFileReadGrant(
  resolveAuthorizedObject: () => Promise<ReadableObject>,
  input: { mode: LegacyFileReadMode; fileName: string },
) {
  return authorizeOrNotFound(async () => {
    // Reject a malformed legacy display name without probing an owning row.
    // The callback is the ONLY source of an authorized, tenant-bound object.
    const options = legacyFileReadOptions(input.mode, input.fileName);
    const file = await resolveAuthorizedObject();
    const grant = await issueObjectReadUrl(file, options);
    return {
      url: grant.url,
      expiresAt: grant.expiresAt,
      expiresInSeconds: grant.expiresInSeconds,
      // Old clients called this publicUrl. It is deliberately a short-lived
      // private grant, NOT an anonymously reusable public R2 object URL.
      access: "PRIVATE_SIGNED" as const,
      // Selected resource metadata is returned only after feature-context
      // authorization. Never include bucket keys, owner IDs, or list/search.
      fileName:options.fileName,
      sizeBytes:file.sizeBytes,
      contentType:file.contentType,
    };
  });
}

/** Client-facing differences are safe to reveal only before authorization:
 * malformed folder names differ from unsupported but well-formed folders.
 */
export function legacyFolderDeclarationError(rawFolder: string):
  "INVALID_FOLDER_PATH" | "FOLDER_NOT_ALLOWED" | null {
  if (!rawFolder.trim() || rawFolder.includes("/") || rawFolder.includes("\\") ||
      rawFolder.includes("..") || rawFolder.length > 80 ||
      /[^a-z0-9-]/.test(rawFolder)) return "INVALID_FOLDER_PATH";
  const allowed = [
    "assignments","lesson-content","profile-images","video-intros","resumes",
    "course-images","identity-docs","marksheets","college-branding",
    "offer-letters","jd-files",
  ];
  return allowed.includes(rawFolder) ? null : "FOLDER_NOT_ALLOWED";
}

/** Helpful legacy folder feedback without exposing whether an object exists. */
export function legacyFolderClientErrorMessage(folder: string): string | null {
 const code=legacyFolderDeclarationError(folder);
 return code==="INVALID_FOLDER_PATH"?"Invalid folder path":
  code==="FOLDER_NOT_ALLOWED"?"Folder is not allowed":null;
}

/** A legacy delete is a RESOURCE mutation, never a public filename deletion.
 * Resolve and authorize the owning row before the caller soft-deletes it and
 * asks its storage lifecycle to remove the now-unreferenced object.
 */
export async function authorizeLegacyFileDelete<T>(
 resolveAuthorizedResource:()=>Promise<T>,
 softDeleteAuthorizedResource:(resource:T)=>Promise<void>,
):Promise<{deleted:true}> {
 return authorizeOrNotFound(async()=>{
  const resource=await resolveAuthorizedResource();
  await softDeleteAuthorizedResource(resource);
  return {deleted:true as const};
 });
}
