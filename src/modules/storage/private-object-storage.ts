import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getAdminStorageBucket } from "@/auth/firebase-admin";

export const PRIVATE_OBJECT_NAMESPACES = [
  "profile-verification",
  "assignment-submission",
  "course-resource",
  "project-resource",
] as const;

export type PrivateObjectNamespace =
  (typeof PRIVATE_OBJECT_NAMESPACES)[number];

const namespaces = new Set<string>(PRIVATE_OBJECT_NAMESPACES);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const mimePattern =
  /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/i;

export class PrivateObjectStorageError extends Error {
  constructor(
    public readonly code:
      | "PRIVATE_STORAGE_INVALID_SCOPE"
      | "PRIVATE_STORAGE_INVALID_NAMESPACE"
      | "PRIVATE_STORAGE_INVALID_MIME"
      | "PRIVATE_STORAGE_INVALID_SIZE"
      | "PRIVATE_STORAGE_BUCKET_UNSAFE"
      | "PRIVATE_STORAGE_OBJECT_NOT_ATTESTED",
  ) {
    super(code);
    this.name = "PrivateObjectStorageError";
  }
}

export type PrivateUploadRequest = {
  collegeId: string;
  ownerMembershipId: string;
  namespace: PrivateObjectNamespace;
  contentType: string;
  expectedSizeBytes: number;
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
  const expiresInMs = input.expiresInMs ?? 10 * 60 * 1000;
  if (
    !Number.isSafeInteger(expiresInMs) ||
    expiresInMs < 60_000 ||
    expiresInMs > 15 * 60 * 1000
  ) {
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_INVALID_SIZE");
  }
  return { ...input, contentType, maxSizeBytes, expiresInMs };
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

async function privateBucket() {
  const bucket = getAdminStorageBucket();
  const [meta] = await bucket.getMetadata();
  const iam = meta.iamConfiguration as
    | { uniformBucketLevelAccess?: { enabled?: boolean }; publicAccessPrevention?: string }
    | undefined;
  if (
    iam?.uniformBucketLevelAccess?.enabled !== true ||
    iam.publicAccessPrevention !== "enforced"
  ) {
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_BUCKET_UNSAFE");
  }
  return bucket;
}

export async function createPrivateUploadGrant(raw: PrivateUploadRequest) {
  const input = validatePrivateUploadRequest(raw);
  const bucket = await privateBucket();
  const objectKey = buildPrivateObjectKey(input);
  const uploadToken = randomBytes(32).toString("hex");
  const uploadTokenHash = createHash("sha256").update(uploadToken).digest("hex");
  const expiresAt = new Date(Date.now() + input.expiresInMs);
  const requiredHeaders = {
    "content-type": input.contentType,
    "x-goog-meta-upload-token": uploadToken,
    "x-goog-meta-owner-membership-id": input.ownerMembershipId,
    "x-goog-meta-college-id": input.collegeId,
    "x-goog-meta-expected-size": String(input.expectedSizeBytes),
    "x-goog-meta-malware-scan-status": "PENDING",
  } as const;
  const [uploadUrl] = await bucket.file(objectKey).getSignedUrl({
    version: "v4",
    action: "write",
    expires: expiresAt,
    contentType: input.contentType,
    extensionHeaders: requiredHeaders,
  });
  return { objectKey, uploadUrl, method: "PUT" as const, expiresAt, requiredHeaders, uploadTokenHash };
}

export async function readPrivateObjectAttestation(
  objectKey: string,
  expected: { collegeId: string; ownerMembershipId: string; uploadTokenHash?: string },
) {
  requireUuid(expected.collegeId);
  requireUuid(expected.ownerMembershipId);
  const prefix = `private/${expected.collegeId}/${expected.ownerMembershipId}/`;
  if (!objectKey.startsWith(prefix) || objectKey.includes("..") || objectKey.includes("://")) {
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_INVALID_SCOPE");
  }
  const bucket = await privateBucket();
  const [meta] = await bucket.file(objectKey).getMetadata();
  const annotation = (meta.metadata ?? {}) as Record<string, string>;
  const generation = String(meta.generation ?? "");
  const sizeBytes = Number(meta.size ?? 0);
  const contentType = String(meta.contentType ?? "");
  const sha256Hex = String(annotation.sha256 ?? "").toLowerCase();
  const uploadToken = String(annotation.upload_token ?? "");
  const tokenMatches =
    expected.uploadTokenHash === undefined ||
    (uploadToken.length > 0 &&
      createHash("sha256").update(uploadToken).digest("hex") === expected.uploadTokenHash);
  if (
    !generation ||
    !Number.isSafeInteger(sizeBytes) ||
    sizeBytes <= 0 ||
    annotation.owner_membership_id !== expected.ownerMembershipId ||
    annotation.college_id !== expected.collegeId ||
    annotation.malware_scan_status !== "CLEAN" ||
    annotation.scan_attested_by !== "lms-vnext-privileged-scanner" ||
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
    scanner: "lms-vnext-privileged-scanner" as const,
  };
}
