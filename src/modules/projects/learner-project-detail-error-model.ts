import type { ProjectsServiceErrorCode } from "./errors";
/** Suppress cross-tenant existence information; genuine loader errors remain retryable. */
export function learnerProjectReadFailureDisposition(
  code: ProjectsServiceErrorCode,
): "NOT_FOUND" | "RETRY" {
  return code === "PROJECT_NOT_FOUND" ||
    code === "PROJECT_ACCESS_DENIED" ||
    code === "COLLEGE_NOT_FOUND"
    ? "NOT_FOUND" : "RETRY";
}
