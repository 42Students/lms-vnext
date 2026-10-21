/**
 * Pure presentation helpers for the file and video UI lanes. No I/O and no
 * server-only imports, so client components can use them. Behavioural truth
 * (limits, permissions, states) stays on the server; these helpers only turn
 * API values into labels.
 */
import {
  MAX_ASSIGNMENT_FILES_PER_SUBMISSION,
  MAX_DOCUMENT_BYTES,
  MAX_THUMBNAIL_BYTES,
  MAX_VIDEO_BYTES,
  acceptAttributeFor,
  allowedExtensionsFor,
  allowedMimeTypesFor,
  guessContentTypeFromName,
  validateStorageDeclaration,
  legacyStorageSizeFailure,
  maxBytesFor,
  type StorageFileKind,
  type LegacyUploadFolder,
} from "./file-policy";
import { STORAGE_FILE_ERROR_STATUS, type StorageFileErrorCode } from "./file-errors";

export {
  MAX_ASSIGNMENT_FILES_PER_SUBMISSION,
  MAX_DOCUMENT_BYTES,
  MAX_THUMBNAIL_BYTES,
  MAX_VIDEO_BYTES,
  acceptAttributeFor,
  allowedExtensionsFor,
  allowedMimeTypesFor,
  guessContentTypeFromName,
  validateStorageDeclaration,
  legacyStorageSizeFailure,
};
export type { StorageFileKind };

export type FileStatus =
  | "UPLOADING"
  | "VERIFYING"
  | "READY"
  | "QUARANTINED"
  | "FAILED"
  | "DELETED";
export type VideoProcessingStatus = "UPLOADING" | "PROCESSING" | "READY" | "FAILED" | "BLOCKED";
export type VideoPublishStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type BadgeTone = "neutral" | "info" | "success" | "warning" | "error";

export type StatusDescriptor = {
  label: string;
  tone: BadgeTone;
  detail: string;
  /** True when the server will issue a download or playback grant. */
  usable: boolean;
};

const FILE_STATUS: Record<FileStatus, StatusDescriptor> = {
  UPLOADING: { label: "Uploading", tone: "info", detail: "The file transfer has not been confirmed yet.", usable: false },
  VERIFYING: { label: "Checking file", tone: "info", detail: "The file is waiting for verification and cannot be opened yet.", usable: false },
  READY: { label: "Available", tone: "success", detail: "The file passed verification.", usable: true },
  QUARANTINED: { label: "Blocked", tone: "warning", detail: "The file failed verification and cannot be opened.", usable: false },
  FAILED: { label: "Failed", tone: "error", detail: "The upload did not complete. Upload the file again.", usable: false },
  DELETED: { label: "Removed", tone: "neutral", detail: "This file is no longer available.", usable: false },
};

export function fileStatusDescriptor(status: FileStatus): StatusDescriptor {
  return FILE_STATUS[status];
}

const VIDEO_PROCESSING: Record<VideoProcessingStatus, StatusDescriptor> = {
  UPLOADING: { label: "Uploading", tone: "info", detail: "The video transfer has not been confirmed yet.", usable: false },
  PROCESSING: { label: "Processing", tone: "info", detail: "The video is being verified and cannot be played yet.", usable: false },
  READY: { label: "Ready", tone: "success", detail: "The video can be published and played.", usable: true },
  FAILED: { label: "Upload failed", tone: "error", detail: "The upload did not complete. Upload the video again.", usable: false },
  BLOCKED: { label: "Unavailable", tone: "warning", detail: "The video failed verification and cannot be played.", usable: false },
};

export function videoProcessingDescriptor(status: VideoProcessingStatus): StatusDescriptor {
  return VIDEO_PROCESSING[status];
}

export function videoPublishLabel(status: VideoPublishStatus, visibleToStudents: boolean) {
  if (status === "ARCHIVED") return "Archived";
  if (status === "DRAFT") return "Draft";
  return visibleToStudents ? "Published" : "Published (hidden from learners)";
}

/** Can the instructor publish this video right now? */
export function videoCanPublish(video: {
  processingStatus: VideoProcessingStatus;
  publishStatus: VideoPublishStatus;
}) {
  return video.processingStatus === "READY" && video.publishStatus !== "PUBLISHED";
}

/** Binary units, one decimal for MiB and above, e.g. "1.5 MiB". */
export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unknown size";
  if (bytes < 1024) return `${Math.trunc(bytes)} B`;
  const units = ["KiB", "MiB", "GiB", "TiB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const text = value.toFixed(1).replace(/\.0$/, "");
  return `${text} ${units[unit]}`;
}

/** 3725 -> "1:02:05", 75 -> "1:15". */
export function formatDuration(totalSeconds: number | null | undefined) {
  if (totalSeconds === null || totalSeconds === undefined || !Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return "--:--";
  }
  const seconds = Math.trunc(totalSeconds);
  const h = Math.trunc(seconds / 3600);
  const m = Math.trunc((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function limitsSummary(kind: StorageFileKind) {
  const max =
    kind === "lesson-video" ? MAX_VIDEO_BYTES : kind === "lesson-video-thumbnail" ? MAX_THUMBNAIL_BYTES : MAX_DOCUMENT_BYTES;
  const extensions = allowedExtensionsFor(kind).map((extension) => extension.toUpperCase());
  return `Up to ${formatFileSize(max)}. Allowed types: ${extensions.join(", ")}.`;
}

const ERROR_MESSAGES: Record<StorageFileErrorCode, string> = {
  STORAGE_NOT_FOUND: "This file or video is not available.",
  STORAGE_FORBIDDEN: "You do not have permission to do this.",
  STORAGE_UPLOADER_MEMBERSHIP_REQUIRED: "Switch to a college account to upload files.",
  STORAGE_NAME_INVALID: "The file name is not valid. Rename the file and try again.",
  STORAGE_TYPE_NOT_ALLOWED: "This file type is not allowed.",
  STORAGE_EXTENSION_MISMATCH: "The file extension does not match the file type.",
  STORAGE_SIZE_INVALID: "The file is empty or its size is not valid.",
  STORAGE_FILE_TOO_LARGE: "The file is larger than the allowed size.",
  STORAGE_DURATION_INVALID: "Enter a duration between 1 second and 24 hours.",
  STORAGE_FILE_LIMIT_REACHED: "The maximum number of files has been reached.",
  STORAGE_INVALID_STATE: "This action is not available in the current state.",
  STORAGE_FILE_NOT_READY: "The file is not ready yet. Try again shortly.",
  STORAGE_UPLOAD_NOT_FOUND: "The upload has not arrived yet. Wait for it to finish, then try again.",
  STORAGE_UPLOAD_EXPIRED: "The upload permission expired. Start the upload again.",
  STORAGE_UPLOAD_MISMATCH: "The uploaded file does not match what was selected. Upload it again.",
  STORAGE_CONTENT_REJECTED: "The file content does not match its type and was rejected.",
  STORAGE_PARENT_NOT_AVAILABLE: "This item is not accepting files right now.",
  STORAGE_ALREADY_SUBMITTED: "This assignment has already been submitted.",
  STORAGE_FILES_REQUIRED: "Add at least one verified file before submitting.",
  STORAGE_NOT_CONFIGURED: "R2 storage is not configured. Contact your administrator or try again later.",
};

/** Maps an API error code to learner-safe copy; unknown codes get a generic message. */
export type StorageUiErrorContext={
 sizeBytes?:number;kind?:StorageFileKind;profileUpload?:boolean;
 legacyFolder?:LegacyUploadFolder;operation?:"upload"|"import";
 httpStatus?:number;
};

/** Legacy presign/import HTTP 429 codes had separate retry instructions. */
export function storageHttpErrorMessage(status:number,operation:"upload"|"import"="upload"):string|null{
 if(status!==429)return null;
 return operation==="import"
  ?"Too many import requests. Please wait before trying again."
  :"Too many upload requests. Please wait before trying again.";
}
export function storageErrorMessage(
  code: string | null | undefined,
  context: StorageUiErrorContext = {},
) {
  const rateLimit=storageHttpErrorMessage(context.httpStatus??0,context.operation);
  if(rateLimit)return rateLimit;
  if(code==="RATE_LIMITED"||code==="TOO_MANY_REQUESTS"||code==="429")
   return storageHttpErrorMessage(429,context.operation)!;
  if(code==="STORAGE_TYPE_NOT_ALLOWED"||code==="STORAGE_EXTENSION_MISMATCH"){
    switch(context.legacyFolder){
      case "jd-files":return "A job description must be a PDF or a Word file";
      case "resumes":return "A resume must be a PDF or a Word file";
      case "lesson-content":return "Choose a supported lecture document or presentation.";
      case "video-intros":return "Choose a supported video file.";
      case "course-images":return "Choose a JPG, PNG or WebP image.";
      case "marksheets":return "A marksheet must be a PDF or an image.";
      case "offer-letters":return "An offer letter must be a PDF or an image.";
    }
    if(context.kind==="lesson-video")return "Choose a supported video file.";
    if(context.kind==="lesson-video-thumbnail")return "Choose a JPG, PNG or WebP image.";
  }
  if(code==="STORAGE_SIZE_INVALID"&&context.sizeBytes===0)
   return "File size must be greater than zero";
  // The API keeps a stable STORAGE_SIZE_INVALID code. UI callers with the
  // original declared size can distinguish an empty file from a negative one.
  if(code==="STORAGE_SIZE_INVALID" && context.sizeBytes!==undefined) {
    return legacyStorageSizeFailure(context.sizeBytes,
      maxBytesFor(context.kind??"assignment-submission")) ??
      ERROR_MESSAGES.STORAGE_SIZE_INVALID;
  }
  if(code==="STORAGE_FORBIDDEN" && context.profileUpload)
    return "Upload is only allowed for your own profile.";
  if (code && Object.hasOwn(ERROR_MESSAGES, code)) {
    return ERROR_MESSAGES[code as StorageFileErrorCode];
  }
  return "Something went wrong. Please try again.";
}

export function isStorageErrorCode(code: string): code is StorageFileErrorCode {
  return Object.hasOwn(STORAGE_FILE_ERROR_STATUS, code);
}

/** Rejects grants whose URL could leak credentials or leave https. */
export function isSafeSignedUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.hash;
  } catch {
    return false;
  }
}
