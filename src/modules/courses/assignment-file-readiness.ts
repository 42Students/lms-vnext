/** New private-storage routes use migration 0080; the old DB06 receipt flag is obsolete. */
export function assignmentFilesRuntimeEnabled() {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
    process.env.R2_ACCESS_KEY?.trim() &&
    process.env.R2_SECRET_KEY?.trim() &&
    process.env.R2_PRIVATE_BUCKET?.trim()
  );
}

/** Migration 0111 is registered; file uploads only require private storage. */
export function multipartAssignmentRuntimeEnabled() {
  return assignmentFilesRuntimeEnabled();
}
