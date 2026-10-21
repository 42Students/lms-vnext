/**
 * Errors raised by the file and video features. The codes are part of the
 * public API contract (docs/architecture/file-and-video-apis.md).
 */
export const STORAGE_FILE_ERROR_STATUS = {
  STORAGE_NOT_FOUND: 404,
  STORAGE_FORBIDDEN: 403,
  STORAGE_UPLOADER_MEMBERSHIP_REQUIRED: 403,
  STORAGE_NAME_INVALID: 400,
  STORAGE_TYPE_NOT_ALLOWED: 400,
  STORAGE_EXTENSION_MISMATCH: 400,
  STORAGE_SIZE_INVALID: 400,
  STORAGE_FILE_TOO_LARGE: 413,
  STORAGE_DURATION_INVALID: 400,
  STORAGE_FILE_LIMIT_REACHED: 409,
  STORAGE_INVALID_STATE: 409,
  STORAGE_FILE_NOT_READY: 409,
  STORAGE_UPLOAD_NOT_FOUND: 409,
  STORAGE_UPLOAD_EXPIRED: 410,
  STORAGE_UPLOAD_MISMATCH: 422,
  STORAGE_CONTENT_REJECTED: 422,
  STORAGE_PARENT_NOT_AVAILABLE: 409,
  STORAGE_ALREADY_SUBMITTED: 409,
  STORAGE_FILES_REQUIRED: 400,
  STORAGE_NOT_CONFIGURED: 503,
  STORAGE_PROVIDER_UNAVAILABLE: 503,
} as const;

export type StorageFileErrorCode = keyof typeof STORAGE_FILE_ERROR_STATUS;

/** Safe, operation-specific copy. Never pass raw R2/AWS exception messages
 * through the upload UI or API response.
 */
export function storageFileFriendlyMessage(
 code:StorageFileErrorCode,operation:"resource"|"generic"="generic",
):string{
 switch(code){
  case "STORAGE_PROVIDER_UNAVAILABLE":
   return "Private document storage is temporarily unavailable. Please try again later.";
  case "STORAGE_NOT_CONFIGURED":
   return operation==="resource"?"Resource storage is unavailable":"File storage is unavailable. Contact your administrator.";
  case "STORAGE_NAME_INVALID":
  case "STORAGE_TYPE_NOT_ALLOWED":
  case "STORAGE_EXTENSION_MISMATCH":
   return operation==="resource"?"Unsupported Resource file name or MIME type":"This file name or type is not supported.";
  case "STORAGE_FILE_TOO_LARGE":
   return operation==="resource"?"Choose a Resource file between 1 byte and 50 MiB.":"This file is too large for the selected upload.";
  case "STORAGE_SIZE_INVALID":
   return "Choose a nonempty file within the configured size limit.";
  case "STORAGE_CONTENT_REJECTED":
   return "This upload was not accepted. Choose a different file.";
  case "STORAGE_FORBIDDEN":
  case "STORAGE_UPLOADER_MEMBERSHIP_REQUIRED":
   return "You do not have permission to upload this file.";
  case "STORAGE_NOT_FOUND":
  case "STORAGE_UPLOAD_NOT_FOUND":
   return "This upload no longer exists. Select the file and try again.";
  case "STORAGE_UPLOAD_EXPIRED":
   return "This upload link expired. Start a new upload.";
  case "STORAGE_UPLOAD_MISMATCH":
   return "The uploaded file does not match the selected file. Start again.";
  case "STORAGE_FILE_LIMIT_REACHED":
   return "The file limit has been reached for this item.";
  case "STORAGE_FILE_NOT_READY":
  case "STORAGE_INVALID_STATE":
   return "This file is not ready yet. Check the upload status and try again.";
  case "STORAGE_FILES_REQUIRED":
   return "Choose at least one file to continue.";
  case "STORAGE_PARENT_NOT_AVAILABLE":
   return "The related course or assignment is no longer available.";
  case "STORAGE_ALREADY_SUBMITTED":
   return "These files have already been submitted.";
  case "STORAGE_DURATION_INVALID":
   return "The selected video's duration is not supported.";
  default:
   return "The file operation could not be completed. Please try again.";
 }
}


export class StorageFileError extends Error {
  constructor(public readonly code: StorageFileErrorCode) {
    super(code);
    this.name = "StorageFileError";
  }

  get status() {
    return STORAGE_FILE_ERROR_STATUS[this.code];
  }
}
