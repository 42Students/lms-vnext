import {ProjectsServiceError,type ProjectsServiceErrorCode} from "./errors";

type ProjectSequenceError = Extract<ProjectsServiceErrorCode,
  "PROJECT_TASK_INVALID_STATE" | "PROJECT_SPRINT_INVALID_STATE" | "PROJECT_LIFECYCLE_INVALID_STATE">;

/** Registered project task/sprint/release sequence columns are int4.
 * Soft-deleted history also retains its order slot under all-row unique indexes.
 * Callers must select the maximum sequence INCLUDING tombstoned records.
 */
export function nextProjectSequence(
  lastReserved: number | null | undefined,
  failureCode: ProjectSequenceError,
): number {
  const previous = lastReserved ?? -1;
  if (!Number.isInteger(previous) || previous < -1 || previous >= 2147483647)
    throw new ProjectsServiceError(failureCode);
  return previous + 1;
}
