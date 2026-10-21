import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getPrivateR2Config } from "./r2-config";
import {
  headObject,
  presignUrl,
  replaceObjectMetadata,
} from "./s3-client";
import { PrivateObjectStorageError } from "./storage-errors";

export { PrivateObjectStorageError };

export const PRIVATE_OBJECT_NAMESPACES = [
  "profile-verification",
  "assignment-submission",
  "course-resource",
  "project-resource",
  "placement-document",
  "lesson-video",
] as const;

export type PrivateObjectNamespace =
  (typeof PRIVATE_OBJECT_NAMESPACES)[number];

const namespaces = new Set<string>(PRIVATE_OBJECT_NAMESPACES);

/** Legacy inventory ONLY; never bypass scope authorization with a public URL,
 * private-doc: reference, or a raw unscoped R2 key. No legacy-data migration
 * is required for vNext. Should a migration ever be commissioned, rehost the
 * bytes in the private bucket, verify/scan, then rewrite owner-scoped records.
 * Null entries require a dedicated destination feature, not a guessed folder.
 */
export const LEGACY_STORAGE_FOLDER_CROSSWALK = {
  "lesson-content": "course-resource",
  "profile-images": null,
  "video-intros": null,
  resumes: "placement-document",
  assignments: "assignment-submission",
  "course-images": "course-resource",
  "identity-docs": "profile-verification",
  marksheets: "profile-verification",
  "college-branding": null,
  "offer-letters": "placement-document",
  "jd-files": null,
} as const satisfies Record<string, PrivateObjectNamespace | null>;
// Legacy lesson videos instead use lesson-video; project assignment attachments
// use project-resource. The authorized parent type, never the folder string,
// determines their namespace during an explicit migration.

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const mimePattern =
  /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/i;

export type PrivateUploadRequest = {
  collegeId: string;
  ownerMembershipId: string;
  namespace: PrivateObjectNamespace;
  contentType: string;
  expectedSizeBytes: number;
  /** Display name is metadata only; never put untrusted names in R2 keys. */
  originalName?: string;
  maxSizeBytes?: number;
  expiresInMs?: number;
};

function requireUuid(value: string) {
  if (!uuidPattern.test(value)) {
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_INVALID_SCOPE");
  }
}

export function validatePrivateUploadRequest(input: PrivateUploadRequest) {
  requireUuid(input.collegeId);
  requireUuid(input.ownerMembershipId);
  if (!namespaces.has(input.namespace)) {
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_INVALID_NAMESPACE");
  }
  const contentType = input.contentType.trim().toLowerCase();
  if (contentType.length > 128 || !mimePattern.test(contentType)) {
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_INVALID_MIME");
  }
  const maxSizeBytes = input.maxSizeBytes ?? 25 * 1024 * 1024;
  if (
    !Number.isSafeInteger(input.expectedSizeBytes) ||
    !Number.isSafeInteger(maxSizeBytes) ||
    input.expectedSizeBytes <= 0 ||
    maxSizeBytes <= 0 ||
    input.expectedSizeBytes > maxSizeBytes
  ) {
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_INVALID_SIZE");
  }
  const originalName = input.originalName?.trim();
  if (originalName && (originalName.length > 255 || /[\\/\x00-\x1f\x7f]/.test(originalName))) {
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_INVALID_SCOPE");
  }
  const expiresInMs = input.expiresInMs ?? 10 * 60 * 1000;
  if (
    !Number.isSafeInteger(expiresInMs) ||
    expiresInMs < 60_000 ||
    expiresInMs > 15 * 60 * 1000
  ) {
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_INVALID_SIZE");
  }
  return { ...input, contentType, originalName: originalName || null, maxSizeBytes, expiresInMs };
}

export type PrivateReadRequest = {
  objectKey: string;
  collegeId: string;
  ownerMembershipId: string;
  expiresInMs?: number;
};

export function validatePrivateReadRequest(
  input: PrivateReadRequest,
) {
  requireUuid(input.collegeId);
  requireUuid(input.ownerMembershipId);
  assertScopedKey(input.objectKey, input);
  const expiresInMs =
    input.expiresInMs ?? 5 * 60 * 1000;
  if (
    !Number.isSafeInteger(expiresInMs) ||
    expiresInMs < 60_000 ||
    expiresInMs > 15 * 60 * 1000
  ) {
    throw new PrivateObjectStorageError(
      "PRIVATE_STORAGE_INVALID_SIZE",
    );
  }
  return { ...input, expiresInMs };
}

export function buildPrivateObjectKey(
  input: Pick<PrivateUploadRequest, "collegeId" | "ownerMembershipId" | "namespace">,
  objectId = randomUUID(),
) {
  requireUuid(input.collegeId);
  requireUuid(input.ownerMembershipId);
  requireUuid(objectId);
  if (!namespaces.has(input.namespace)) {
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_INVALID_NAMESPACE");
  }
  return ["private", input.collegeId, input.ownerMembershipId, input.namespace, objectId].join("/");
}

const SCANNER_ID = "lms-vnext-privileged-scanner";

export async function createPrivateUploadGrant(raw: PrivateUploadRequest) {
  const input = validatePrivateUploadRequest(raw);
  const config = getPrivateR2Config();
  const objectKey = buildPrivateObjectKey(input);
  const uploadToken = randomBytes(32).toString("hex");
  const uploadTokenHash = createHash("sha256").update(uploadToken).digest("hex");
  const expiresAt = new Date(Date.now() + input.expiresInMs);
  const requiredHeaders = {
    "content-type": input.contentType,
    "x-amz-meta-upload-token": uploadToken,
    "x-amz-meta-owner-membership-id": input.ownerMembershipId,
    "x-amz-meta-college-id": input.collegeId,
    "x-amz-meta-expected-size": String(input.expectedSizeBytes),
    "x-amz-meta-malware-scan-status": "PENDING",
  } as const;
  const uploadUrl = presignUrl(config, {
    method: "PUT",
    key: objectKey,
    expiresSeconds: Math.floor(input.expiresInMs / 1000),
    headers: requiredHeaders,
  });
  return {
    objectKey, uploadUrl, method: "PUT" as const, expiresAt, requiredHeaders,
    uploadTokenHash,
    originalName: input.originalName,
    // Browser clients must renew a one-use grant before expiry and send exactly
    // these signed headers on their direct PUT. Upload bytes never pass this
    // server's JS heap. Completion requires a fresh HEAD and scan attestation.
    refreshBefore: new Date(expiresAt.getTime() - Math.min(30_000, input.expiresInMs / 2)),
  };
}

function assertScopedKey(
  objectKey: string,
  expected: { collegeId: string; ownerMembershipId: string },
) {
  requireUuid(expected.collegeId);
  requireUuid(expected.ownerMembershipId);
  // Exact generated namespace/UUID shape: no extra slashes, raw legacy
  // keys, traversal, public URLs or arbitrary prefix-matching objects.
  const parts = objectKey.split("/");
  if (
    parts.length !== 5 ||
    parts[0] !== "private" ||
    parts[1] !== expected.collegeId ||
    parts[2] !== expected.ownerMembershipId ||
    !namespaces.has(parts[3] ?? "") ||
    !uuidPattern.test(parts[4] ?? "")
  ) {
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_INVALID_SCOPE");
  }
}

export async function readPrivateObjectAttestation(
  objectKey: string,
  expected: { collegeId: string; ownerMembershipId: string; uploadTokenHash?: string },
) {
  assertScopedKey(objectKey, expected);
  // 404 is missing; network/configuration errors must propagate separately.
  let head: Awaited<ReturnType<typeof headObject>>;
  try {
    head = await headObject(getPrivateR2Config(), objectKey);
  } catch (error) {
    if (error instanceof PrivateObjectStorageError) throw error;
    // Provider or credential outages must not be misreported as a missing
    // document, or as user error. Never pass raw S3 URLs/errors to clients.
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_PROVIDER_UNAVAILABLE");
  }
  if (!head) {
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_OBJECT_NOT_ATTESTED");
  }
  const annotation = head.metadata;
  // Last-Modified in epoch ms is the object "generation": numeric, and it
  // changes whenever the object or its metadata is rewritten.
  const generation = String(head.lastModifiedMs || "");
  const sizeBytes = head.sizeBytes;
  const contentType = head.contentType;
  const sha256Hex = String(annotation["sha256"] ?? "").toLowerCase();
  const uploadToken = String(annotation["upload-token"] ?? "");
  const tokenMatches =
    expected.uploadTokenHash === undefined ||
    (uploadToken.length > 0 &&
      createHash("sha256").update(uploadToken).digest("hex") === expected.uploadTokenHash);
  if (
    !generation ||
    !Number.isSafeInteger(sizeBytes) ||
    sizeBytes <= 0 ||
    annotation["owner-membership-id"] !== expected.ownerMembershipId ||
    annotation["college-id"] !== expected.collegeId ||
    annotation["malware-scan-status"] !== "CLEAN" ||
    annotation["scan-attested-by"] !== SCANNER_ID ||
    !/^[0-9a-f]{64}$/.test(sha256Hex) ||
    !mimePattern.test(contentType) ||
    !tokenMatches
  ) {
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_OBJECT_NOT_ATTESTED");
  }
  return {
    objectKey,
    generation,
    sizeBytes,
    contentType,
    sha256Hex,
    scanStatus: "CLEAN" as const,
    scanner: SCANNER_ID,
  };
}

/**
 * Scanner-only: records the scan verdict on the object. R2 has no metadata
 * patch, so this is a server-side copy onto itself with replaced metadata,
 * which also advances the generation. Never call this from a request that
 * carries client-supplied scan claims.
 */
export async function recordPrivateObjectScanVerdict(
  objectKey: string,
  input: {
    collegeId: string;
    ownerMembershipId: string;
    sha256Hex: string;
    verdict: "CLEAN" | "INFECTED";
  },
) {
  assertScopedKey(objectKey, input);
  if (!/^[0-9a-f]{64}$/.test(input.sha256Hex)) {
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_OBJECT_NOT_ATTESTED");
  }
  const config = getPrivateR2Config();
  const head = await headObject(config, objectKey);
  if (
    !head ||
    head.metadata["owner-membership-id"] !== input.ownerMembershipId ||
    head.metadata["college-id"] !== input.collegeId
  ) {
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_OBJECT_NOT_ATTESTED");
  }
  await replaceObjectMetadata(
    config,
    objectKey,
    {
      ...head.metadata,
      sha256: input.sha256Hex,
      "malware-scan-status": input.verdict,
      "scan-attested-by": SCANNER_ID,
    },
    head.contentType,
  );
}

/**
 * Produces a short-lived read URL after the caller has already authorized
 * access to the owning membership. Scope IDs alone are NOT authorization:
 * the caller must check parent row, college, role, visibility and enrollment. The object must still pass the same tenant
 * scope, malware scan and checksum attestation. Public bucket URLs are never
 * returned or persisted. Every link expires within 1–15 minutes (default
 * five minutes); obtain a fresh authorized grant rather than persisting URL.
 */
export async function createPrivateReadGrant(raw: PrivateReadRequest) {
  const input = validatePrivateReadRequest(raw);
  const attestation = await readPrivateObjectAttestation(input.objectKey, {
    collegeId: input.collegeId,
    ownerMembershipId: input.ownerMembershipId,
  });
  const expiresAt = new Date(Date.now() + input.expiresInMs);
  const readUrl = presignUrl(getPrivateR2Config(), {
    method: "GET",
    key: input.objectKey,
    expiresSeconds: Math.floor(input.expiresInMs / 1000),
    // Prevent private files being cached in an intermediary browser/proxy.
    query: { "response-cache-control": "private, no-store, max-age=0" },
  });

  return {
    objectKey: input.objectKey,
    readUrl,
    expiresAt,
    refreshBefore: new Date(expiresAt.getTime() - Math.min(30_000, input.expiresInMs / 2)),
    generation: attestation.generation,
    contentType: attestation.contentType,
    sizeBytes: attestation.sizeBytes,
    sha256Hex: attestation.sha256Hex,
  };
}
