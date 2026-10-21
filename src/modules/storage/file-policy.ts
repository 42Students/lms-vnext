/**
 * Pure upload policy shared by the assignment, project resource and lesson
 * video features: allowed types, size and count limits, declaration checks and
 * magic-byte verification. No I/O, safe to import from client code.
 *
 * Limits come from the legacy LMS (FileUploadController presign):
 * - documents/assignment/generic files: 50 MiB (upload.generic.max-size-bytes)
 * - images (thumbnails): legacy image cap 10 MiB, course-images 5 MiB; vNext uses 5 MiB
 * - videos: 5120 MiB legacy; vNext 4900 MiB so that one presigned PUT stays below
 *   the R2 single-request ceiling (multipart upload is not implemented)
 */

export const STORAGE_FILE_NAMESPACES = [
  "assignment-submission",
  "project-resource",
  "lesson-video",
] as const;
export type StorageFileNamespace = (typeof STORAGE_FILE_NAMESPACES)[number];

export const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 4900 * 1024 * 1024;
export const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;
/** Learner staging cap per assignment and delivery (vNext safety limit, not a legacy rule). */
export const MAX_ASSIGNMENT_FILES_PER_SUBMISSION = 10;
export const MAX_PROJECT_FILES_PER_PROJECT = 200;
export const MAX_VIDEOS_PER_LESSON_DELIVERY = 50;
export const MAX_VIDEO_DURATION_SECONDS = 86_400;

type TypeSpec = { mime: string; extensions: readonly string[] };

const DOCUMENT_TYPES: readonly TypeSpec[] = [
  { mime: "application/pdf", extensions: ["pdf"] },
  { mime: "application/msword", extensions: ["doc"] },
  {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extensions: ["docx"],
  },
  { mime: "application/vnd.ms-powerpoint", extensions: ["ppt"] },
  {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    extensions: ["pptx"],
  },
  { mime: "application/vnd.ms-excel", extensions: ["xls"] },
  {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extensions: ["xlsx"],
  },
  { mime: "text/plain", extensions: ["txt"] },
  { mime: "text/csv", extensions: ["csv"] },
  { mime: "application/rtf", extensions: ["rtf"] },
  { mime: "image/jpeg", extensions: ["jpg", "jpeg"] },
  { mime: "image/png", extensions: ["png"] },
  { mime: "image/webp", extensions: ["webp"] },
  { mime: "application/zip", extensions: ["zip"] },
];

const PROJECT_EXTRA_TYPES: readonly TypeSpec[] = [
  { mime: "text/markdown", extensions: ["md", "markdown"] },
];

const VIDEO_TYPES: readonly TypeSpec[] = [
  { mime: "video/mp4", extensions: ["mp4", "m4v"] },
  { mime: "video/webm", extensions: ["webm"] },
  { mime: "video/quicktime", extensions: ["mov"] },
  { mime: "video/x-msvideo", extensions: ["avi"] },
  { mime: "video/x-m4v", extensions: ["m4v"] },
];

const THUMBNAIL_TYPES: readonly TypeSpec[] = [
  { mime: "image/jpeg", extensions: ["jpg", "jpeg"] },
  { mime: "image/png", extensions: ["png"] },
  { mime: "image/webp", extensions: ["webp"] },
];

export type StorageFileKind = StorageFileNamespace | "lesson-video-thumbnail";

type KindSpec = {
  maxBytes: number;
  types: readonly TypeSpec[];
  label: string;
};

const KIND_SPECS: Record<StorageFileKind, KindSpec> = {
  "assignment-submission": {
    maxBytes: MAX_DOCUMENT_BYTES,
    types: DOCUMENT_TYPES,
    label: "assignment file",
  },
  "project-resource": {
    maxBytes: MAX_DOCUMENT_BYTES,
    types: [...DOCUMENT_TYPES, ...PROJECT_EXTRA_TYPES],
    label: "project resource",
  },
  "lesson-video": {
    maxBytes: MAX_VIDEO_BYTES,
    types: VIDEO_TYPES,
    label: "lesson video",
  },
  "lesson-video-thumbnail": {
    maxBytes: MAX_THUMBNAIL_BYTES,
    types: THUMBNAIL_TYPES,
    label: "video thumbnail",
  },
};

/**
 * Legacy folder translation: declared old folder names never authorize a new
 * upload. Null namespace means no vNext writer exists for that category.
 * Dedicated writers must enforce these narrower caps and their own scope.
 */
const legacyMiB=1024*1024;
export const LEGACY_FILE_UPLOAD_CAPS={
 genericBytes:50*legacyMiB,lectureBytes:50*legacyMiB,
 presentationBytes:100*legacyMiB,imageBytes:10*legacyMiB,
 legacyVideoBytes:5120*legacyMiB,vNextVideoBytes:MAX_VIDEO_BYTES,
} as const;
type LegacyFolderPolicy={
 validatorKind:StorageFileKind;maxBytes:number;
 allowedMimes:readonly string[];namespace:StorageFileNamespace|null;
};
const wordMimes=[
 "application/pdf","application/msword",
 "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
const imageMimes=["image/jpeg","image/png","image/webp"] as const;
const identityMimes=["application/pdf","image/jpeg","image/png"] as const;
export const LEGACY_FOLDER_POLICY={
 "lesson-content":{validatorKind:"project-resource",maxBytes:50*legacyMiB,
  allowedMimes:DOCUMENT_TYPES.map(spec=>spec.mime),namespace:null},
 "profile-images":{validatorKind:"lesson-video-thumbnail",maxBytes:5*legacyMiB,
  allowedMimes:imageMimes,namespace:null},
 "video-intros":{validatorKind:"lesson-video",maxBytes:MAX_VIDEO_BYTES,
  allowedMimes:VIDEO_TYPES.map(spec=>spec.mime),namespace:null},
 "resumes":{validatorKind:"project-resource",maxBytes:50*legacyMiB,
  allowedMimes:wordMimes,namespace:null},
 "assignments":{validatorKind:"assignment-submission",maxBytes:MAX_DOCUMENT_BYTES,
  allowedMimes:DOCUMENT_TYPES.map(spec=>spec.mime),namespace:"assignment-submission"},
 "course-images":{validatorKind:"lesson-video-thumbnail",maxBytes:5*legacyMiB,
  allowedMimes:imageMimes,namespace:null},
 "identity-docs":{validatorKind:"project-resource",maxBytes:50*legacyMiB,
  allowedMimes:identityMimes,namespace:null},
 "marksheets":{validatorKind:"project-resource",maxBytes:5*legacyMiB,
  allowedMimes:identityMimes,namespace:null},
 "college-branding":{validatorKind:"lesson-video-thumbnail",maxBytes:5*legacyMiB,
  allowedMimes:["image/png"],namespace:null},
 "offer-letters":{validatorKind:"project-resource",maxBytes:10*legacyMiB,
  allowedMimes:identityMimes,namespace:null},
 "jd-files":{validatorKind:"project-resource",maxBytes:5*legacyMiB,
  allowedMimes:wordMimes,namespace:null},
} as const satisfies Record<string,LegacyFolderPolicy>;
export type LegacyUploadFolder=keyof typeof LEGACY_FOLDER_POLICY;

/** Validation only, never a storage grant. Strict JD, offer, branding and
 * marksheet formats remain narrower than generic project-resource types. */
export function validateLegacyFolderDeclaration(
 folder:LegacyUploadFolder,raw:StorageDeclaration,
):StorageDeclarationResult {
 const policy:LegacyFolderPolicy=LEGACY_FOLDER_POLICY[folder];
 const generic=validateStorageDeclaration(policy.validatorKind,raw);
 if(!generic.ok)return generic;
 if(!policy.allowedMimes.includes(generic.value.contentType))
  return {ok:false,code:"STORAGE_TYPE_NOT_ALLOWED"};
 if(generic.value.sizeBytes>policy.maxBytes)
  return {ok:false,code:"STORAGE_FILE_TOO_LARGE"};
 return generic;
}
/** Keep the legacy zero-versus-negative size copy without altering
 * stable STORAGE_SIZE_INVALID/FILE_TOO_LARGE API codes and statuses. */
export function legacyStorageSizeFailure(sizeBytes:number,maxBytes:number):string|null{
 if(!Number.isSafeInteger(sizeBytes))return "Enter a valid file size.";
 if(sizeBytes<0)return "File size cannot be negative.";
 if(sizeBytes===0)return "File is empty.";
 if(sizeBytes>maxBytes)return "Choose a file between 1 byte and "+Math.floor(maxBytes/legacyMiB)+" MiB.";
 return null;
}

export function maxBytesFor(kind: StorageFileKind) {
  return KIND_SPECS[kind].maxBytes;
}

export function allowedMimeTypesFor(kind: StorageFileKind): readonly string[] {
  return KIND_SPECS[kind].types.map((spec) => spec.mime);
}

export function allowedExtensionsFor(kind: StorageFileKind): readonly string[] {
  return [...new Set(KIND_SPECS[kind].types.flatMap((spec) => spec.extensions))];
}

/** Value for an HTML file input `accept` attribute. */
export function acceptAttributeFor(kind: StorageFileKind) {
  return allowedExtensionsFor(kind)
    .map((extension) => `.${extension}`)
    .join(",");
}

/** Thumbnails live in the lesson-video namespace next to their video. */
export function namespaceForKind(kind: StorageFileKind): StorageFileNamespace {
  return kind === "lesson-video-thumbnail" ? "lesson-video" : kind;
}

export type StorageDeclarationErrorCode =
  | "STORAGE_NAME_INVALID"
  | "STORAGE_TYPE_NOT_ALLOWED"
  | "STORAGE_EXTENSION_MISMATCH"
  | "STORAGE_SIZE_INVALID"
  | "STORAGE_FILE_TOO_LARGE";

export type StorageDeclaration = {
  originalName: string;
  contentType: string;
  sizeBytes: number;
};

export type StorageDeclarationResult =
  | { ok: true; value: StorageDeclaration }
  | { ok: false; code: StorageDeclarationErrorCode };

/** Normalizes a declared MIME type: lowercase and without parameters. */
export function normalizeContentType(value: string) {
  return value.split(";")[0]!.trim().toLowerCase();
}

export function fileExtension(name: string) {
  const index = name.lastIndexOf(".");
  return index < 0 ? "" : name.slice(index + 1).toLowerCase();
}

export function validateStorageDeclaration(
  kind: StorageFileKind,
  raw: StorageDeclaration,
): StorageDeclarationResult {
  const spec = KIND_SPECS[kind];
  const originalName = raw.originalName.trim();
  if (
    originalName.length < 1 ||
    originalName.length > 255 ||
    /[\\/\0\r\n]/.test(originalName) ||
    originalName === "." ||
    originalName === ".."
  ) {
    return { ok: false, code: "STORAGE_NAME_INVALID" };
  }
  const contentType = normalizeContentType(raw.contentType);
  const type = spec.types.find((entry) => entry.mime === contentType);
  if (!type) return { ok: false, code: "STORAGE_TYPE_NOT_ALLOWED" };
  if (!type.extensions.includes(fileExtension(originalName))) {
    return { ok: false, code: "STORAGE_EXTENSION_MISMATCH" };
  }
  if (!Number.isSafeInteger(raw.sizeBytes) || raw.sizeBytes < 1) {
    return { ok: false, code: "STORAGE_SIZE_INVALID" };
  }
  if (raw.sizeBytes > spec.maxBytes) {
    return { ok: false, code: "STORAGE_FILE_TOO_LARGE" };
  }
  return { ok: true, value: { originalName, contentType, sizeBytes: raw.sizeBytes } };
}

/**
 * Best-effort content type for a browser File whose `type` is empty (common
 * for .md/.csv/.mov). Used by the UI lanes before calling the upload grant API.
 */
export function guessContentTypeFromName(kind: StorageFileKind, name: string) {
  const extension = fileExtension(name);
  return KIND_SPECS[kind].types.find((spec) => spec.extensions.includes(extension))?.mime ?? null;
}

function startsWith(bytes: Uint8Array, signature: readonly number[], offset = 0) {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((value, index) => bytes[offset + index] === value);
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

const ISO_BMFF_BRANDS_AT_4 = new Set(["ftyp", "moov", "free", "wide", "mdat", "skip", "pnot"]);

/**
 * Checks the first bytes of an object against the declared MIME type. This is
 * a structural sanity check (the dev attestation uses it), not malware
 * scanning. Text-like types must not contain NUL bytes.
 */
export function magicBytesMatch(contentType: string, head: Uint8Array): boolean {
  const type = normalizeContentType(contentType);
  if (head.length === 0) return false;
  switch (type) {
    case "application/pdf":
      // Readers tolerate leading junk up to 1024 bytes; require the header there.
      return ascii(head, 0, Math.min(head.length, 1024)).includes("%PDF-");
    case "image/png":
      return startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/jpeg":
      return startsWith(head, [0xff, 0xd8, 0xff]);
    case "image/webp":
      return ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 12) === "WEBP";
    case "application/zip":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return startsWith(head, [0x50, 0x4b, 0x03, 0x04]) || startsWith(head, [0x50, 0x4b, 0x05, 0x06]);
    case "application/msword":
    case "application/vnd.ms-powerpoint":
    case "application/vnd.ms-excel":
      return startsWith(head, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    case "application/rtf":
      return ascii(head, 0, 5) === "{\\rtf";
    case "text/plain":
    case "text/csv":
    case "text/markdown":
      return !head.includes(0);
    case "video/mp4":
    case "video/x-m4v":
    case "video/quicktime":
      return head.length >= 12 && ISO_BMFF_BRANDS_AT_4.has(ascii(head, 4, 8));
    case "video/webm":
      return startsWith(head, [0x1a, 0x45, 0xdf, 0xa3]);
    case "video/x-msvideo":
      return ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 12) === "AVI ";
    default:
      return false;
  }
}

/** Number of leading bytes the attestation reads for magic-byte checks. */
export const MAGIC_BYTES_WINDOW = 4096;
