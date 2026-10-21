import "server-only";

import { createHash } from "node:crypto";
import {
  MAGIC_BYTES_WINDOW,
  MAX_DOCUMENT_BYTES,
  magicBytesMatch,
  maxBytesFor,
  namespaceForKind,
  normalizeContentType,
  type StorageFileKind,
} from "./file-policy";
import { StorageFileError } from "./file-errors";
import {
  PrivateObjectStorageError,
  createPrivateUploadGrant,
} from "./private-object-storage";
import { getPrivateR2Config } from "./r2-config";
import {
  deleteObject,
  getObjectStream,
  headObject,
  presignUrl,
} from "./s3-client";

/** Recorded in scan_attested_by when the dev attestation marks an upload usable. */
export const DEV_ATTESTATION_ID = "lms-vnext-dev-attestation";
/** Reserved for the future privileged malware scanner. */
export const PRODUCTION_SCANNER_ID = "lms-vnext-privileged-scanner";

/**
 * The dev attestation is available only when APP_ENV is explicitly
 * "development" or "test". An unset or any other value fails closed, so a
 * production deployment that forgot APP_ENV still never serves unscanned
 * uploads. Production default: uploads stay VERIFYING / PROCESSING and are
 * never served until a real scanner records a verdict.
 */
export function devAttestationAllowed(env: NodeJS.ProcessEnv = process.env) {
  return env.APP_ENV === "development" || env.APP_ENV === "test";
}

function mapStorageError(error: unknown): never {
  if (error instanceof PrivateObjectStorageError) {
    if (error.code === "PRIVATE_STORAGE_NOT_CONFIGURED" || error.code === "PRIVATE_STORAGE_BUCKET_UNSAFE") {
      throw new StorageFileError("STORAGE_NOT_CONFIGURED");
    }
    throw new StorageFileError("STORAGE_SIZE_INVALID");
  }
  throw error;
}

function wrapStorageError<T>(run: () => T): T {
  try {
    return run();
  } catch (error) {
    return mapStorageError(error);
  }
}

async function wrapStorageErrorAsync<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    return mapStorageError(error);
  }
}

export type IssuedUpload = {
  objectKey: string;
  uploadUrl: string;
  method: "PUT";
  expiresAt: Date;
  requiredHeaders: Record<string, string>;
  uploadTokenHash: string;
};

/** Presigned PUT bound to type, scope, size and a random token; scan status PENDING. */
export async function issueObjectUpload(input: {
  collegeId: string;
  ownerMembershipId: string;
  kind: StorageFileKind;
  contentType: string;
  sizeBytes: number;
}): Promise<IssuedUpload> {
  const grant = await wrapStorageErrorAsync(() =>
    createPrivateUploadGrant({
      collegeId: input.collegeId,
      ownerMembershipId: input.ownerMembershipId,
      namespace: namespaceForKind(input.kind),
      contentType: input.contentType,
      expectedSizeBytes: input.sizeBytes,
      maxSizeBytes: maxBytesFor(input.kind),
    }),
  );
  return {
    objectKey: grant.objectKey,
    uploadUrl: grant.uploadUrl,
    method: grant.method,
    expiresAt: grant.expiresAt,
    requiredHeaders: { ...grant.requiredHeaders },
    uploadTokenHash: grant.uploadTokenHash,
  };
}

export type UploadedObject = {
  objectKey: string;
  collegeId: string;
  ownerMembershipId: string;
  kind: StorageFileKind;
  declaredContentType: string;
  declaredSizeBytes: number;
  uploadTokenHash: string;
};

export type CompletionOutcome =
  | { outcome: "NOT_UPLOADED" }
  | { outcome: "MISMATCH"; failureCode: string }
  | { outcome: "QUARANTINED"; failureCode: string }
  | {
      outcome: "VERIFYING";
      generation: string;
      sizeBytes: number;
      contentType: string;
    }
  | {
      outcome: "READY";
      generation: string;
      sizeBytes: number;
      contentType: string;
      sha256Hex: string | null;
      attestedBy: string;
    };

async function readHeadAndHash(
  objectKey: string,
  sizeBytes: number,
  hashWholeObject: boolean,
) {
  const config = getPrivateR2Config();
  const hash = createHash("sha256");
  const chunks: Uint8Array[] = [];
  let headLength = 0;
  let total = 0;

  const stream = await getObjectStream(
    config,
    objectKey,
    hashWholeObject ? undefined : { start: 0, end: MAGIC_BYTES_WINDOW - 1 },
  );
  if (!stream) return null;
  const reader = stream.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (hashWholeObject) hash.update(value);
    if (headLength < MAGIC_BYTES_WINDOW) {
      chunks.push(value);
      headLength += value.length;
    }
    if (!hashWholeObject && headLength >= MAGIC_BYTES_WINDOW) {
      await reader.cancel();
      break;
    }
    if (total > sizeBytes + 1) {
      await reader.cancel();
      break;
    }
  }
  const joined = new Uint8Array(headLength);
  let cursor = 0;
  for (const chunk of chunks) {
    joined.set(chunk, cursor);
    cursor += chunk.length;
  }
  return {
    head: joined.slice(0, MAGIC_BYTES_WINDOW),
    totalBytes: total,
    sha256Hex: hashWholeObject ? hash.digest("hex") : null,
  };
}

/**
 * DEV-ONLY scan attestation. Marks a PENDING upload usable after verifying its
 * size, content type and magic bytes (and, for files up to 50 MiB, recording
 * its SHA-256). It is NOT malware scanning. Throws unless APP_ENV is
 * development or test. Production must record the verdict through a real
 * scanner; until then uploads stay unserved.
 */
export async function devOnlyAttestPendingUpload(input: {
  objectKey: string;
  kind: StorageFileKind;
  contentType: string;
  sizeBytes: number;
  env?: NodeJS.ProcessEnv;
}): Promise<
  | { ok: true; sha256Hex: string | null; attestedBy: typeof DEV_ATTESTATION_ID }
  | { ok: false; failureCode: "STORAGE_CONTENT_REJECTED" | "STORAGE_UPLOAD_MISMATCH" }
> {
  if (!devAttestationAllowed(input.env)) {
    throw new StorageFileError("STORAGE_FORBIDDEN");
  }
  const hashWholeObject = input.sizeBytes <= MAX_DOCUMENT_BYTES && input.kind !== "lesson-video";
  const read = await readHeadAndHash(input.objectKey, input.sizeBytes, hashWholeObject);
  if (!read) return { ok: false, failureCode: "STORAGE_UPLOAD_MISMATCH" };
  if (hashWholeObject && read.totalBytes !== input.sizeBytes) {
    return { ok: false, failureCode: "STORAGE_UPLOAD_MISMATCH" };
  }
  if (!magicBytesMatch(input.contentType, read.head)) {
    return { ok: false, failureCode: "STORAGE_CONTENT_REJECTED" };
  }
  return { ok: true, sha256Hex: read.sha256Hex, attestedBy: DEV_ATTESTATION_ID };
}

/**
 * Verifies that the browser really uploaded the declared object, then (outside
 * production) attests it. Returns what the caller must persist. Never trusts
 * client claims: size, content type, owner scope and the upload token all come
 * from the object's own HEAD response.
 */
export async function verifyUploadedObject(
  upload: UploadedObject,
  options: { env?: NodeJS.ProcessEnv } = {},
): Promise<CompletionOutcome> {
  const config = wrapStorageError(() => getPrivateR2Config());
  const head = await headObject(config, upload.objectKey);
  if (!head) return { outcome: "NOT_UPLOADED" };

  const tokenMatches =
    typeof head.metadata["upload-token"] === "string" &&
    createHash("sha256").update(head.metadata["upload-token"]).digest("hex") ===
      upload.uploadTokenHash;
  if (
    !tokenMatches ||
    head.metadata["owner-membership-id"] !== upload.ownerMembershipId ||
    head.metadata["college-id"] !== upload.collegeId ||
    head.metadata["malware-scan-status"] !== "PENDING"
  ) {
    return { outcome: "MISMATCH", failureCode: "STORAGE_UPLOAD_MISMATCH" };
  }
  if (
    head.sizeBytes !== upload.declaredSizeBytes ||
    normalizeContentType(head.contentType) !== normalizeContentType(upload.declaredContentType) ||
    !head.lastModifiedMs
  ) {
    return { outcome: "MISMATCH", failureCode: "STORAGE_UPLOAD_MISMATCH" };
  }

  const verified = {
    generation: String(head.lastModifiedMs),
    sizeBytes: head.sizeBytes,
    contentType: normalizeContentType(head.contentType),
  };

  if (!devAttestationAllowed(options.env)) {
    return { outcome: "VERIFYING", ...verified };
  }
  const attestation = await devOnlyAttestPendingUpload({
    objectKey: upload.objectKey,
    kind: upload.kind,
    contentType: verified.contentType,
    sizeBytes: verified.sizeBytes,
    env: options.env,
  });
  if (!attestation.ok) {
    return { outcome: "QUARANTINED", failureCode: attestation.failureCode };
  }
  return {
    outcome: "READY",
    ...verified,
    sha256Hex: attestation.sha256Hex,
    attestedBy: attestation.attestedBy,
  };
}

export type ReadableObject = {
  objectKey: string;
  collegeId: string;
  ownerMembershipId: string;
  generation: string;
  sizeBytes: number;
  contentType: string;
};

/** Translate legacy read modes to private, owner-checked signed URLs.
 * Callers must first resolve a file by a tenant-scoped resource database row;
 * accepting a legacy fileName alone never grants storage access.
 */
export type LegacyFileReadMode = "download" | "get" | "stream";
export function legacyFileReadOptions(mode: LegacyFileReadMode, fileName: string) {
  const name = fileName.trim();
  if (!name || name.length > 255 || name === "." || name === ".." ||
      name.includes("/") || name.includes("\\") ||
      Array.from(name).some(character => character.charCodeAt(0) < 32)) {
    throw new StorageFileError("STORAGE_NAME_INVALID");
  }
  return {
    ttlSeconds: FILE_READ_TTL_SECONDS,
    maxTtlSeconds: FILE_READ_TTL_SECONDS,
    disposition: mode === "download" ? "attachment" as const : "inline" as const,
    fileName: name,
  };
}

/** Legacy folder names are hints only, never generic presign permissions. */
export const LEGACY_FILE_GRANT_ROUTE = {
  assignments: "/api/courses/assignments/[assignmentId]/file-upload",
  "lesson-content": null,
  "profile-images": null,
  "video-intros": null,
  resumes: null,
  "course-images": null,
  "identity-docs": null,
  marksheets: null,
  "college-branding": null,
  "offer-letters": null,
  "jd-files": null,
} as const;

export const FILE_READ_TTL_SECONDS = 5 * 60;
export const VIDEO_PLAYBACK_DEFAULT_TTL_SECONDS = 60 * 60;
export const VIDEO_PLAYBACK_MAX_TTL_SECONDS = 120 * 60;

function contentDisposition(disposition: "inline" | "attachment", fileName: string) {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

/**
 * Short-lived presigned GET. The caller must already have authorized the
 * request against the database row. The object is re-checked (HEAD) against
 * the recorded generation, size and content type so a replaced or tampered
 * object is never served. R2 presigned GET URLs honour HTTP Range, so video
 * seeking works without any proxying. The URL is returned to the caller and
 * never stored.
 */
export async function issueObjectReadUrl(
  object: ReadableObject,
  options: {
    ttlSeconds: number;
    maxTtlSeconds: number;
    disposition?: "inline" | "attachment";
    fileName?: string;
  },
): Promise<{ url: string; expiresAt: Date; expiresInSeconds: number }> {
  const prefix = `private/${object.collegeId}/${object.ownerMembershipId}/`;
  if (!object.objectKey.startsWith(prefix) || object.objectKey.includes("..")) {
    throw new StorageFileError("STORAGE_NOT_FOUND");
  }
  const ttl = Math.min(Math.max(Math.trunc(options.ttlSeconds), 60), options.maxTtlSeconds);
  const config = wrapStorageError(() => getPrivateR2Config());
  const head = await headObject(config, object.objectKey);
  if (
    !head ||
    String(head.lastModifiedMs) !== object.generation ||
    head.sizeBytes !== object.sizeBytes ||
    normalizeContentType(head.contentType) !== normalizeContentType(object.contentType) ||
    head.metadata["college-id"] !== object.collegeId ||
    head.metadata["owner-membership-id"] !== object.ownerMembershipId
  ) {
    throw new StorageFileError("STORAGE_FILE_NOT_READY");
  }
  const query: Record<string, string> = {};
  if (options.disposition) {
    query["response-content-disposition"] = contentDisposition(
      options.disposition,
      options.fileName ?? "download",
    );
  }
  const url = presignUrl(config, {
    method: "GET",
    key: object.objectKey,
    expiresSeconds: ttl,
    query,
  });
  return { url, expiresAt: new Date(Date.now() + ttl * 1000), expiresInSeconds: ttl };
}

/** Best-effort removal; failures are swallowed because rows are the source of truth. */
export async function removeStoredObject(objectKey: string) {
  try {
    await deleteObject(getPrivateR2Config(), objectKey);
  } catch {
    // The row is already soft-deleted; a stray object is never served.
  }
}
