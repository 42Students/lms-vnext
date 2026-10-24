/**
 * Resource status transitions are explicit, even for long-lived archived
 * entries. Callers must still check authorized project scope and current DB
 * version while holding the project's transaction lock.
 */
export function isArchivableProjectResourceStatus(status: string): boolean {
  return status === "ACTIVE" || status === "DRAFT";
}

/** Restoration cannot double as a metadata edit or bypass a version token. */
export function isArchivedResourceRestoreOnly(
  input: { status?: string; expectedUpdatedAt?: string },
): boolean {
  return input.status === "ACTIVE" &&
    typeof input.expectedUpdatedAt === "string" &&
    input.expectedUpdatedAt.length > 0 &&
    Object.keys(input).every(key => key === "status" || key === "expectedUpdatedAt");
}
