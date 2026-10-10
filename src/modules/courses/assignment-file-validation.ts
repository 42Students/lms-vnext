import { z } from "zod";
import { courseSectionDeliveryIdSchema } from "./validation";

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

export type AssignmentFileUploadRequest =
  z.infer<
    typeof assignmentFileUploadRequestSchema
  >;
