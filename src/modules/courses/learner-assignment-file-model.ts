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
  uploadUrl: z.string().url().refine(value => new URL(value).protocol === "https:", "A secure upload URL is required"),
  expiresAt: z.iso.datetime({ offset: true }),
  requiredHeaders: z.record(z.string(), z.string()), originalName: z.string().min(1).max(255),
}).strict() }).strict();

export function learnerAssignmentFilePayload(deliveryId: string, receiptId: string, confirmed: boolean) {
  return z.object({ deliveryId: z.string().uuid(), uploadReceiptId: z.string().uuid(),
    submissionType: z.literal("FILE"), confirmed: z.literal(true) }).strict().parse({
    deliveryId, uploadReceiptId: receiptId, submissionType: "FILE", confirmed,
  });
}
