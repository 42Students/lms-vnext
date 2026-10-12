import "server-only";
import { getAdminStorageBucket } from "@/auth/firebase-admin";
import type { Receipt } from "./evidence";

/**
 * Verifies uploaded private objects against GCS, not merely DB receipt text.
 * Fail-closed until uniform bucket-level access, Public Access Prevention and
 * a trusted privileged malware scanner are configured.
 *
 * The scanner must write protected custom metadata after inspecting the
 * object. Client-supplied scan claims MUST NOT be accepted by upload flows.
 * No signing/upload/download route is exposed by this module.
 */
export async function verifyGcsPrivateDocumentReceipt(receipt: Receipt): Promise<boolean> {
  if (receipt.scanStatus !== "CLEAN" ||
      receipt.revokedAt !== null ||
      (receipt.retentionUntil !== null && receipt.retentionUntil <= new Date()) ||
      !/^private\/[a-zA-Z0-9_\/-]+$/.test(receipt.privateObjectKey) ||
      receipt.privateObjectKey.includes("..") ||
      !/^[0-9]+$/.test(receipt.objectGeneration) ||
      !/^[0-9a-f]{64}$/i.test(receipt.sha256Hex)) return false;
  // Upload grants use private/<college UUID>/<membership UUID>/profile-verification/<object UUID>.
  // Never trust a CLEAN-looking scanner annotation from a different person's
  // object: the path, canonical receipt owner and privileged object metadata
  // must all describe the same membership and college.
  const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
  const keyPattern = new RegExp(`^private/(${uuid})/(${uuid})/profile-verification/(${uuid})import "server-only";
import { getAdminStorageBucket } from "@/auth/firebase-admin";
import type { Receipt } from "./evidence";

/**
 * Verifies uploaded private objects against GCS, not merely DB receipt text.
 * Fail-closed until uniform bucket-level access, Public Access Prevention and
 * a trusted privileged malware scanner are configured.
 *
 * The scanner must write protected custom metadata after inspecting the
 * object. Client-supplied scan claims MUST NOT be accepted by upload flows.
 * No signing/upload/download route is exposed by this module.
 */
export async function verifyGcsPrivateDocumentReceipt(receipt: Receipt): Promise<boolean> {
  if (receipt.scanStatus !== "CLEAN" ||
      receipt.revokedAt !== null ||
      (receipt.retentionUntil !== null && receipt.retentionUntil <= new Date()) ||
      !/^private\/[a-zA-Z0-9_\/-]+$/.test(receipt.privateObjectKey) ||
      receipt.privateObjectKey.includes("..") ||
      !/^[0-9]+$/.test(receipt.objectGeneration) ||
      !/^[0-9a-f]{64}$/i.test(receipt.sha256Hex)) return false;
, "i");
  const keyParts = keyPattern.exec(receipt.privateObjectKey);
  if (!keyParts ||
      keyParts[2]?.toLowerCase() !== receipt.owningMembershipId.toLowerCase()) return false;
  const collegeId = keyParts[1]!.toLowerCase();
  try {
    const bucket = getAdminStorageBucket();
    const [bucketMeta] = await bucket.getMetadata();
    // Bucket IAM controls prevent raw public object access.
    const iam = bucketMeta.iamConfiguration as
      | { uniformBucketLevelAccess?: { enabled?: boolean }; publicAccessPrevention?: string }
      | undefined;
    if (iam?.uniformBucketLevelAccess?.enabled !== true ||
        iam.publicAccessPrevention !== "enforced") return false;
    const [objectMeta] = await bucket.file(receipt.privateObjectKey).getMetadata();
    if (String(objectMeta.generation ?? "") !== receipt.objectGeneration ||
        String(objectMeta.size ?? "") !== String(receipt.sizeBytes) ||
        objectMeta.contentType !== receipt.mimeType) return false;
    const annotation = objectMeta.metadata as Record<string, string> | undefined;
    // Only a backend scanner with bucket metadata write privileges may set
    // these fields; uploaded clients must lack overwrite/metadata permissions.
    return annotation?.sha256?.toLowerCase() === receipt.sha256Hex.toLowerCase() &&
      annotation?.owner_membership_id?.toLowerCase() === receipt.owningMembershipId.toLowerCase() &&
      annotation?.college_id?.toLowerCase() === collegeId &&
      annotation?.malware_scan_status === "CLEAN" &&
      annotation?.scan_attested_by === "lms-vnext-privileged-scanner";
  } catch {
    return false;
  }
}
