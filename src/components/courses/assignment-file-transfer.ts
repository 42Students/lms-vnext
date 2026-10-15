import { learnerAssignmentFileRequest, validateLearnerAssignmentUploadGrant } from "@/modules/courses/learner-assignment-file-model";
import { courseApiError } from "./learner-course-api";

/** The app authorizes the receipt; only a signed PUT URL receives bytes, without app cookies. */
export async function transferLearnerAssignmentFile(
  assignmentId: string, deliveryId: string, file: File, signal: AbortSignal,
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  const request = learnerAssignmentFileRequest(deliveryId, file);
  if (!request.success) throw new Error(request.error.issues[0]?.message ?? "Choose a supported file up to 50 MB.");
  const response = await fetcher(`/api/courses/assignments/${encodeURIComponent(assignmentId)}/file-upload`, {
    method: "POST", credentials: "same-origin", signal,
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(request.data),
  });
  if (!response.ok) throw new Error(await courseApiError(response));
  const grant = validateLearnerAssignmentUploadGrant(await response.json(), now());
  if (grant.originalName !== request.data.originalName ||
      grant.requiredHeaders["content-type"] !== request.data.contentType ||
      (grant.requiredHeaders["x-amz-meta-expected-size"] !== undefined &&
        grant.requiredHeaders["x-amz-meta-expected-size"] !== String(file.size)) ||
      Date.parse(grant.expiresAt) <= now()) {
    throw new Error("The upload permission is invalid or expired. Try uploading again.");
  }
  const uploaded = await fetcher(grant.uploadUrl, {
    method: "PUT", credentials: "omit", redirect: "error", signal, headers: grant.requiredHeaders, body: file,
  });
  if (!uploaded.ok) throw new Error("The file could not be uploaded. Your assignment has not been submitted.");
  if (Date.parse(grant.expiresAt) <= now()) {
    throw new Error("Upload permission expired before confirmation. Upload the file again.");
  }
  return { receiptId: grant.receiptId, originalName: grant.originalName, expiresAt: grant.expiresAt };
}
