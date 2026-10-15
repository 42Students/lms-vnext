import { z } from "zod";
import { assignmentFileUploadRequestSchema } from "./assignment-file-validation";

const mimeByExtension: Readonly<Record<string, string>> = {
  pdf: "application/pdf", txt: "text/plain", csv: "text/csv", rtf: "application/rtf",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", zip: "application/zip",
};
export const learnerAssignmentFileAccept = ".pdf,.txt,.csv,.rtf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.zip";

export function learnerAssignmentFileRequest(deliveryId: string, file: { name: string; size: number; type: string }) {
  const extension = file.name.split(".").at(-1)?.toLowerCase() ?? "";
  return assignmentFileUploadRequestSchema.safeParse({
    deliveryId, originalName: file.name,
    contentType: file.type.trim().toLowerCase() || mimeByExtension[extension] || "application/octet-stream",
    sizeBytes: file.size,
  });
}

export const learnerAssignmentUploadGrantSchema = z.object({ grant: z.object({
  receiptId: z.string().uuid(), method: z.literal("PUT"),
  uploadUrl: z.string().url().refine(value => { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && !url.hash; }, "A secure upload URL is required"),
  expiresAt: z.iso.datetime({ offset: true }),
  requiredHeaders: z.record(z.string(), z.string()), originalName: z.string().min(1).max(255),
}).strict() }).strict();

export function learnerAssignmentFilePayload(deliveryId: string, receiptId: string, confirmed: boolean) {
  return z.object({ deliveryId: z.string().uuid(), uploadReceiptId: z.string().uuid(),
    submissionType: z.literal("FILE"), confirmed: z.literal(true) }).strict().parse({
    deliveryId, uploadReceiptId: receiptId, submissionType: "FILE", confirmed,
  });
}

export const learnerAssignmentReadGrantSchema = z.object({ grant: z.object({
  readUrl: z.string().url().refine(value => {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  }, "A secure file URL is required"),
  expiresAt: z.iso.datetime({ offset: true }), originalName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(128), sizeBytes: z.number().int().min(1).max(50 * 1024 * 1024),
}).strict() }).strict();

export function validateLearnerAssignmentReadGrant(input: unknown, nowMs: number) {
  const { grant } = learnerAssignmentReadGrantSchema.parse(input);
  const lifetimeMs = Date.parse(grant.expiresAt) - nowMs;
  if (lifetimeMs <= 0 || lifetimeMs > 15 * 60 * 1000) throw new Error("File link is expired or invalid. Prepare a new link.");
  return grant;
}
