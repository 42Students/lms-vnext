import { learnerAssignmentFileRequest } from "./learner-assignment-file-model";
/** Fail early for unsupported files, before requesting a signed PUT grant. */
export function selectLearnerAssignmentFile<T extends { name: string; size: number; type: string }>(deliveryId: string, file: T | null): { file: T | null; error: string | null } {
  if (!file) return { file: null, error: null };
  const result = learnerAssignmentFileRequest(deliveryId, file);
  return result.success
    ? { file, error: null }
    : { file: null, error: result.error.issues[0]?.message ?? "Choose a supported assignment file." };
}
