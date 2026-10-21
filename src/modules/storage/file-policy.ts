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

/** Resource FILEs mirror the narrower old lesson-content uploader; broad
 * project uploads and 50 MiB assignment ZIP/RTF uploads stay separate.
 */
const LEGACY_LESSON_RESOURCE_TYPES:readonly TypeSpec[]=DOCUMENT_TYPES.filter(spec=>
  !["application/rtf","application/zip"].includes(spec.mime));
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
  allowedMimes:LEGACY_LESSON_RESOURCE_TYPES.map(spec=>spec.mime),namespace:null},
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
    /[\\/\x00-\x1f\x7f\u2028\u2029]/.test(originalName) ||
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

/** The old form's `type` (NOT a vNext object namespace) is only a display/
 * validation hint. Folder and numeric parent IDs MUST be looked up against a
 * verified user/college/delivery before creating a signed grant.
 */
export const LEGACY_UPLOAD_TYPE_MATRIX={
 document:{kind:"assignment-submission",maxBytes:MAX_DOCUMENT_BYTES},
 resource:{kind:"project-resource",maxBytes:MAX_DOCUMENT_BYTES},
 lecture:{kind:"project-resource",maxBytes:MAX_DOCUMENT_BYTES},
 presentation:{kind:"project-resource",maxBytes:MAX_DOCUMENT_BYTES},
 video:{kind:"lesson-video",maxBytes:MAX_VIDEO_BYTES},
 image:{kind:"lesson-video-thumbnail",maxBytes:MAX_THUMBNAIL_BYTES},
 resume:{kind:"project-resource",maxBytes:MAX_DOCUMENT_BYTES},
 generic:{kind:"assignment-submission",maxBytes:MAX_DOCUMENT_BYTES},
} as const satisfies Record<string,{kind:StorageFileKind;maxBytes:number}>;

export type LegacyUploadRequestFieldNames={
 fileName?:string;filename?:string;contentType?:string;contentLength?:number;
 folder?:string;type?:string;courseId?:number;classId?:number;
};
export function translateLegacyUploadDeclaration(input:LegacyUploadRequestFieldNames){
 const originalName=input.fileName??input.filename??"";
 const contentType=input.contentType??"";
 const sizeBytes=input.contentLength??NaN;
 return {originalName,contentType,sizeBytes} satisfies StorageDeclaration;
}

/** Namespaces in this list are not equivalent to authorizations. A null target
 * means the old operation is not ported and callers must use an explicit
 * alternate feature route instead of pretending that an upload worked.
 */
export function legacyUploadTypeHelp(rawType:string,rawFolder:string):{
 kind:StorageFileKind|null;accept:string;limitBytes:number;help:string;serverImportEnabled:false;
}{
 const type=LEGACY_UPLOAD_TYPE_MATRIX[rawType.toLowerCase() as keyof typeof LEGACY_UPLOAD_TYPE_MATRIX];
 const folder=LEGACY_FOLDER_POLICY[rawFolder as LegacyUploadFolder];
 const kind=folder?.namespace?folder.validatorKind:null;
 const limitBytes=kind?Math.min(type?.maxBytes??maxBytesFor(kind),folder.maxBytes):0;
 const accept=kind?acceptAttributeFor(kind):"";
 const help=rawFolder==="lesson-content"?
   "Resource files up to 50 MiB. PDF, Word, PowerPoint, Excel, CSV, text and JPEG/PNG/WebP.":
   rawType==="video"?"Videos up to 4,900 MiB. Single upload; pause and resume are unavailable.":
   kind?"Choose a file up to "+(limitBytes/(1024*1024))+" MiB.":"Use a current authenticated feature file picker.";
 return {kind,accept,limitBytes,help,serverImportEnabled:false};
}

/** URL imports previously fetched arbitrary remote URLs. A URL remains a
 * first-class LINK Resource (no server-side fetching), never a video FILE.
 */
export function legacyResourceUrlAlternative(rawUrl:unknown):{
 ok:true;kind:"LINK";url:string
}|{ok:false;message:string}{
 if(typeof rawUrl!=="string"||rawUrl.length>2048)
  return {ok:false,message:"Enter a valid HTTPS link."};
 try{
  const url=new URL(rawUrl);
  const host=url.hostname.toLowerCase();
  if(url.protocol!=="https:"||!host||url.username||url.password||url.hash||
    host==="localhost"||host.endsWith(".localhost")||host==="0.0.0.0"||
    /^127\./.test(host)||/^10\./.test(host)||/^192\.168\./.test(host)||
    /^169\.254\./.test(host)||/^172\.(?:1[6-9]|2[0-9]|3[01])\./.test(host))
   return {ok:false,message:"Use a public HTTPS link without credentials."};
  return {ok:true,kind:"LINK",url:url.toString()};
 }catch{return {ok:false,message:"Enter a valid HTTPS link."};}
}

/** Legacy UI's omitted or 0 duration meant "unknown"; vNext accepts null
 * until metadata is provided, never sends zero to the 1..86400 validator.
 */
export function legacyVideoDurationSeconds(raw:unknown):number|null{
 if(raw===null||raw===undefined||raw==="")return null;
 if(typeof raw!=="number"||!Number.isSafeInteger(raw)||raw<0||raw>MAX_VIDEO_DURATION_SECONDS)
  return null;
 return raw===0?null:raw;
}

/** Old R2 storage key contains numeric source IDs. These are migration
 * lineage only: UI and grant must use persisted UUID content+delivery+college.
 * No account may sign an arbitrary legacy key or return its publicUrl.
 */
export function legacyUploadScopeMetadata(input:{
 collegeId:string;ownerMembershipId:string;courseOfferingId:string;
 lessonContentId?:string;deliveryId?:string|null;
}){
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 const keys=[input.collegeId,input.ownerMembershipId,input.courseOfferingId,
   input.lessonContentId,input.deliveryId].filter((id):id is string=>typeof id==="string");
 if(keys.some(id=>!uuid.test(id)))return null;
 return {...input};
}
