import "server-only";

import { CoursesServiceError } from "@/modules/courses/errors";
import { AuthorizationError } from "@/modules/permissions/policy";
import { ProjectsServiceError } from "@/modules/projects/errors";
import { StorageFileError } from "./file-errors";

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
