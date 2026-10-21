import { z } from "zod";
import { courseSectionDeliveryIdSchema } from "./validation";
import { MAX_ASSIGNMENT_FILES_PER_SUBMISSION } from "@/modules/storage/file-policy";

export const MAX_ASSIGNMENT_FILE_BYTES =
  50 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "application/rtf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/zip",
]);


/** Extension is only a consistency check; storage scanning remains authoritative. */
const permittedExtensionsByMime: Readonly<Record<string, readonly string[]>> = {
  "application/pdf":["pdf"], "application/msword":["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":["docx"],
  "application/vnd.ms-powerpoint":["ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":["pptx"],
  "application/vnd.ms-excel":["xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":["xlsx"],
  "text/plain":["txt"], "text/csv":["csv"], "application/rtf":["rtf"],
  "image/jpeg":["jpg","jpeg"], "image/png":["png"], "image/webp":["webp"],
  "application/zip":["zip"],
};

export const assignmentFileUploadRequestSchema =
  z.object({
    deliveryId:
      courseSectionDeliveryIdSchema,
    originalName: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .refine(
        (value) =>
          !/[\\/\0]/.test(value) &&
          value !== "." &&
          value !== "..",
        "File name is invalid",
      ),
    contentType: z
      .string()
      .trim()
      .toLowerCase()
      .refine(
        (value) =>
          allowedMimeTypes.has(value),
        "File type is not allowed for assignment submissions",
      ),
    sizeBytes: z
      .number()
      .int()
      .min(1)
      .max(
        MAX_ASSIGNMENT_FILE_BYTES,
      ),
  }).superRefine((value, ctx) => {
    const ext = value.originalName.split(".").at(-1)?.toLowerCase() ?? "";
    if (!permittedExtensionsByMime[value.contentType]?.includes(ext)) {
      ctx.addIssue({ code: "custom", path: ["originalName"], message: "File extension does not match the declared file type" });
    }
  });

export const assignmentFileSubmissionSchema =
  z.object({
    deliveryId:
      courseSectionDeliveryIdSchema,
    submissionType:
      z.literal("FILE"),
    uploadReceiptId:
      z.string().uuid(),
  });

/** Multi-asset receipt contract. Each attachment has its own verified
 * upload receipt and immutable zero-based position. Validation alone does NOT
 * prove ownership, MIME safety, quarantine clearance or single consumption:
 * the submission transaction must verify all receipts before writing assets.
 */
export const assignmentMultipartFileSubmissionSchema=z.strictObject({
 deliveryId:courseSectionDeliveryIdSchema,
 submissionType:z.literal("FILE"),
 files:z.array(z.strictObject({
  uploadReceiptId:z.uuid(),
  position:z.number().int().nonnegative(),
 })).min(1).max(MAX_ASSIGNMENT_FILES_PER_SUBMISSION),
}).superRefine((data,ctx)=>{
 const seen=new Set<string>();
 data.files.forEach((item,index)=>{
  if(seen.has(item.uploadReceiptId))
   ctx.addIssue({code:"custom",path:["files",index,"uploadReceiptId"],
    message:"Each uploaded file must have its own receipt"});
  seen.add(item.uploadReceiptId);
  if(item.position!==index)
   ctx.addIssue({code:"custom",path:["files",index,"position"],
    message:"File order must match the selected attachment order"});
 });
});
export type AssignmentMultipartFileSubmission=z.infer<typeof assignmentMultipartFileSubmissionSchema>;

export type AssignmentFileUploadRequest =
  z.infer<
    typeof assignmentFileUploadRequestSchema
  >;
