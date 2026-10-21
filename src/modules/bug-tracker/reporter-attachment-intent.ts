import { z } from "zod";

/**
 * Validation-only reporter screenshot contracts. No upload endpoints are
 * enabled until the storage team adds a tenant-verified bug-tracker namespace
 * and scanner, plus a report ownership check and atomic 3-image cap.
 * Never issue public PUT/GET credentials from this model alone.
 */
export const BUG_REPORT_ATTACHMENT_MAX_BYTES = 8 * 1024 * 1024;
export const BUG_REPORT_ATTACHMENT_MAX_COUNT = 3;
export const BUG_REPORT_ATTACHMENT_UPLOAD_TTL_MS = 15 * 60 * 1000;
export const bugReportAttachmentPresignSchema = z.strictObject({
  fileName: z.string().trim().min(1, "Invalid screenshot file name.").max(255),
  contentType: z.enum(["image/png", "image/jpeg", "image/webp"], {
    error: "Only PNG, JPEG and WebP screenshots are supported.",
  }),
  contentLength: z.number().int().min(1).max(BUG_REPORT_ATTACHMENT_MAX_BYTES),
});
export const bugReportAttachmentConfirmSchema = z.strictObject({
  storageKey: z.string().trim().min(1).max(700),
  originalFilename: z.string().trim().min(1).max(255),
});
