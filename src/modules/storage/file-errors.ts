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
} as const;

export type StorageFileErrorCode = keyof typeof STORAGE_FILE_ERROR_STATUS;

export class StorageFileError extends Error {
  constructor(public readonly code: StorageFileErrorCode) {
    super(code);
    this.name = "StorageFileError";
  }

  get status() {
    return STORAGE_FILE_ERROR_STATUS[this.code];
  }
}
