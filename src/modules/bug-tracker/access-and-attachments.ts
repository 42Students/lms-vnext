/**
 * DB10 legacy bug tracker external access/attachment validation.
 * The legacy read routes were no-login public endpoints. vNext deliberately
 * must not replicate unrestricted engineering notes or attachment access.
 * Caller must resolve access from a verified server-side session/token.
 */

export type BugTrackerPrincipal =
  | { kind: "SUPER_ADMIN"; active: boolean; id: string }
  | { kind: "REPORTER"; active: boolean; accessId: string }
  | { kind: "ANONYMOUS" };

export type BugTrackerAccessResource = {
  reporterAccessId: string;
};

export function canReadBugTrackerIssue(
  principal: BugTrackerPrincipal,
  issue: BugTrackerAccessResource,
): boolean {
  if (principal.kind === "SUPER_ADMIN") {
    return principal.active && principal.id.trim().length > 0;
  }
  if (principal.kind === "REPORTER") {
    return (
      principal.active &&
      principal.accessId.trim().length > 0 &&
      principal.accessId === issue.reporterAccessId
    );
  }
  return false;
}

export function canMutateBugTrackerWorkflow(
  principal: BugTrackerPrincipal,
): boolean {
  return principal.kind === "SUPER_ADMIN" &&
    principal.active &&
    principal.id.trim().length > 0;
}

export const BUG_SCREENSHOT_MAX_BYTES = 8 * 1024 * 1024;
export const BUG_SCREENSHOT_MAX_PER_ISSUE = 3;

const fileTypes = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;

export class BugTrackerAttachmentError extends Error {
  constructor(
    readonly code: "INVALID_FILE" | "TOO_MANY_ATTACHMENTS" | "INVALID_STORAGE_KEY",
    message?: string,
  ) {
    super(message ?? code);
    this.name = "BugTrackerAttachmentError";
  }
}

export function bugScreenshotType(raw: string): {
  contentType: keyof typeof fileTypes;
  extension: "png" | "jpg" | "webp";
} {
  const type = raw.trim().toLowerCase().split(";")[0]?.trim() ?? "";
  if (!Object.prototype.hasOwnProperty.call(fileTypes, type)) {
    throw new BugTrackerAttachmentError("INVALID_FILE","Screenshot must be a PNG, JPEG or WebP image.");
  }
  const contentType = type as keyof typeof fileTypes;
  return { contentType, extension: fileTypes[contentType] };
}

function safeFileName(raw: string): string {
  if (
    typeof raw !== "string" ||
    raw.length > 255 ||
    /[/\\\x00-\x1f\x7f]/.test(raw)
  ) {
    throw new BugTrackerAttachmentError("INVALID_FILE");
  }
  const name = raw.trim();
  if (!name || name === "." || name === "..") {
    throw new BugTrackerAttachmentError("INVALID_FILE");
  }
  return name;
}

function attachmentCount(count: number) {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new BugTrackerAttachmentError("INVALID_FILE");
  }
  if (count >= BUG_SCREENSHOT_MAX_PER_ISSUE) {
    throw new BugTrackerAttachmentError(
      "TOO_MANY_ATTACHMENTS",
      "This issue already has the maximum number of screenshots",
    );
  }
}

function assertFileSize(bytes: number) {
  if (
    !Number.isSafeInteger(bytes) ||
    bytes < 1 ||
    bytes > BUG_SCREENSHOT_MAX_BYTES
  ) {
    throw new BugTrackerAttachmentError(
      "INVALID_FILE",
      "Screenshot is empty or larger than 8 MB. Choose an image up to 8 MB.",
    );
  }
}

export function validateBugScreenshotUpload(input: {
  fileName: string;
  contentType: string;
  contentLength: number;
  currentCount: number;
}) {
  attachmentCount(input.currentCount);
  assertFileSize(input.contentLength);
  const name = safeFileName(input.fileName);
  return { originalFilename: name, ...bugScreenshotType(input.contentType) };
}

export function validateBugScreenshotConfirmation(input: {
  publicId: string;
  storageKey: string;
  originalFilename: string;
  storedContentType: string;
  storedLength: number;
  currentCount: number;
}) {
  attachmentCount(input.currentCount);
  assertFileSize(input.storedLength);
  const originalFilename = safeFileName(input.originalFilename);
  const mime = bugScreenshotType(input.storedContentType);
  // Key must be for this issue, not merely sharing a textual prefix.
  const expectedPrefix = "bug-tracker/" + input.publicId + "/";
  const tail = input.storageKey.startsWith(expectedPrefix)
    ? input.storageKey.slice(expectedPrefix.length)
    : "";
  const match = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(png|jpg|webp)$/i.exec(tail);
  if (
    !/^LMS-[0-9]{4,}$/.test(input.publicId) ||
    !match ||
    match[2]?.toLowerCase() !== mime.extension
  ) {
    throw new BugTrackerAttachmentError("INVALID_STORAGE_KEY");
  }
  return {
    storageKey: input.storageKey,
    originalFilename,
    contentType: mime.contentType,
    sizeBytes: input.storedLength,
  };
}

// Map provisional-upload, missing-file and invalid image failures to
// actionable copy without revealing private signed object URLs.
export function bugScreenshotErrorMessage(error:unknown):string{
 if(error instanceof BugTrackerAttachmentError){
  if(error.code==="TOO_MANY_ATTACHMENTS")return "A report can have up to 3 screenshots.";
  if(error.code==="INVALID_STORAGE_KEY")return "Screenshot not found. Upload it again.";
  return error.message&&error.message!=="INVALID_FILE"?error.message:
   "Invalid file. Choose a PNG, JPEG or WebP screenshot up to 8 MB.";
 }
 return "Screenshot unavailable. Check the file and try again.";
}
