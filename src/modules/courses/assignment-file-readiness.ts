export function assignmentFilesRuntimeEnabled() {
  return process.env.DB06_ASSIGNMENT_FILES_READY === "DB06_VERIFIED";
}
