import { z } from "zod";
import { isSafeSignedUrl, storageErrorMessage, type FileStatus } from "@/modules/storage/ui-models";

const uuid = z.string().uuid();
export const submissionFileSchema = z.object({
  id: uuid, assignmentId: uuid, deliveryId: uuid,
  submissionId: uuid.nullable(), sequence: z.number().int().nullable(),
  originalName: z.string().min(1), contentType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  status: z.enum(["UPLOADING", "VERIFYING", "READY", "QUARANTINED", "FAILED", "DELETED"]),
  failureCode: z.string().nullable(), createdAt: z.string(), completedAt: z.string().nullable(),
}).passthrough();
export type SubmissionFile = z.infer<typeof submissionFileSchema>;
export function parseSubmissionFiles(input: unknown): SubmissionFile[] {
  return z.object({ files: z.array(submissionFileSchema) }).parse(input).files;
}
export function readySubmissionFileIds(files: SubmissionFile[]): string[] {
  return files.filter(file => !file.submissionId && file.status === "READY").map(file => file.id);
}
export function canSubmitStagedFiles(files: SubmissionFile[]): boolean {
  const staged = files.filter(file => !file.submissionId);
  return staged.length > 0 && staged.length <= 10 && staged.every(file => file.status === "READY");
}
export function canRemoveStagedFile(file: { submissionId: string | null; status: FileStatus }): boolean {
  return file.submissionId === null && file.status !== "DELETED";
}

const secureUrl = z.string().url().refine(isSafeSignedUrl, "A secure signed URL is required");
const expiresAt = z.iso.datetime({ offset: true });
const headers = z.record(z.string(), z.string());
export const stagedUploadGrantSchema = z.object({
  file: submissionFileSchema,
  grant: z.object({
    receiptId: uuid, method: z.literal("PUT"), uploadUrl: secureUrl,
    expiresAt, requiredHeaders: headers, originalName: z.string().min(1),
  }),
});
export function parseStagedUploadGrant(input: unknown, now: number) {
  const { file, grant } = stagedUploadGrantSchema.parse(input);
  const ttl = Date.parse(grant.expiresAt) - now;
  if (ttl <= 0 || ttl > 15 * 60_000 || file.id !== grant.receiptId ||
      file.originalName !== grant.originalName || file.status !== "UPLOADING") {
    throw new Error("The upload permission is invalid or expired. Try again.");
  }
  const allowed = ["content-type", "x-amz-meta-upload-token", "x-amz-meta-owner-membership-id",
    "x-amz-meta-college-id", "x-amz-meta-expected-size", "x-amz-meta-malware-scan-status"];
  if (Object.keys(grant.requiredHeaders).length !== allowed.length ||
      allowed.some(key => !Object.hasOwn(grant.requiredHeaders, key)) ||
      grant.requiredHeaders["content-type"] !== file.contentType ||
      grant.requiredHeaders["x-amz-meta-expected-size"] !== String(file.sizeBytes) ||
      grant.requiredHeaders["x-amz-meta-malware-scan-status"] !== "PENDING" ||
      Object.entries(grant.requiredHeaders).some(([key, value]) =>
        !allowed.includes(key) || !value || /[\r\n]/.test(value))) {
    throw new Error("The upload permission headers are invalid.");
  }
  return { file, grant };
}
export function parseFileDownloadGrant(input: unknown, now: number) {
  const { grant } = z.object({ grant: z.object({
    url: secureUrl, expiresAt, expiresInSeconds: z.number().positive(),
    file: submissionFileSchema,
  }) }).parse(input);
  if (Date.parse(grant.expiresAt) <= now ||
      Date.parse(grant.expiresAt) - now > 15 * 60_000 ||
      grant.file.status !== "READY") {
    throw new Error("File link expired or is not ready.");
  }
  return grant;
}

export const learnerVideoSchema = z.object({
  id: uuid, lessonId: uuid, lessonContentId: uuid.nullable(),
  title: z.string(), sequence: z.number().int(), durationSeconds: z.number().nullable(),
  contentType: z.string(), hasThumbnail: z.boolean(),
});
export type LearnerVideo = z.infer<typeof learnerVideoSchema>;
export function parseLearnerVideos(input: unknown): LearnerVideo[] {
  return z.object({ videos: z.array(learnerVideoSchema) }).parse(input).videos;
}
export function videoForContent(videos: LearnerVideo[], contentId: string, storageKey: string | null) {
  const direct = videos.find(video => video.lessonContentId === contentId);
  if (direct) return direct;
  const candidate = storageKey?.match(/^video-asset\/([0-9a-fA-F-]{36})$/)?.[1];
  return candidate ? videos.find(video => video.id === candidate && !video.lessonContentId) ?? null : null;
}
export function parseLearnerPlaybackGrant(input: unknown, videoId: string, now: number) {
  const { grant } = z.object({ grant: z.object({
    url: secureUrl, expiresAt, expiresInSeconds: z.number().positive().max(7200),
    resumePositionSeconds: z.number().nonnegative(),
    supportsRange: z.literal(true), durationSeconds: z.number().nullable(),
    thumbnailUrl: secureUrl.nullable(), video: learnerVideoSchema,
  }) }).parse(input);
  const ttl = Date.parse(grant.expiresAt) - now;
  if (grant.video.id !== videoId || ttl <= 0 || ttl > 7200_000) {
    throw new Error("Video playback permission expired or invalid.");
  }
  return grant;
}
export async function storageApiError(response: Response) {
  try {
    const body = await response.json() as { error?: string; issues?: Array<{message?: string}> };
    if (body.error === "INVALID_ORIGIN") return "This action could not be verified. Refresh the page and try again.";
    if (body.error === "INVALID_REQUEST") return body.issues?.[0]?.message ?? "Please check the information and try again.";
    return storageErrorMessage(body.error);
  } catch {
    return storageErrorMessage(null);
  }
}
