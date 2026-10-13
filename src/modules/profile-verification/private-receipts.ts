import "server-only";
import { getPrivateR2Config } from "@/modules/storage/r2-config";
import { headObject } from "@/modules/storage/s3-client";
import type { Receipt } from "./evidence";

/**
 * Verifies uploaded private objects against R2, not merely DB receipt text.
 * Fails closed unless the object carries the privileged scanner's attestation.
 *
 * The scanner writes protected object metadata after inspecting the object
 * (see recordPrivateObjectScanVerdict). Client-supplied scan claims MUST NOT be
 * accepted by upload flows; the signed upload headers pin PENDING.
 */
export async function verifyPrivateDocumentReceipt(receipt: Receipt): Promise<boolean> {
  if (receipt.scanStatus !== "CLEAN" ||
      receipt.revokedAt !== null ||
      (receipt.retentionUntil !== null && receipt.retentionUntil <= new Date()) ||
      !/^private\/[a-zA-Z0-9_\/-]+$/.test(receipt.privateObjectKey) ||
      receipt.privateObjectKey.includes("..") ||
      !/^[0-9]+$/.test(receipt.objectGeneration) ||
      !/^[0-9a-f]{64}$/i.test(receipt.sha256Hex)) return false;
  // The only supported profile evidence upload layout is the tenant- and
  // membership-scoped path produced by buildPrivateObjectKey.
  const uuidPattern = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
  const scopedPath = new RegExp(
    `^private/(${uuidPattern})/(${uuidPattern})/profile-verification/(${uuidPattern})$`,
    "i",
  );
  const segments = scopedPath.exec(receipt.privateObjectKey);
  if (!segments ||
      segments[2]?.toLowerCase() !== receipt.owningMembershipId.toLowerCase()) return false;
  const expectedCollegeId = segments[1]!.toLowerCase();
  try {
    const head = await headObject(getPrivateR2Config(), receipt.privateObjectKey);
    if (!head ||
        String(head.lastModifiedMs) !== receipt.objectGeneration ||
        String(head.sizeBytes) !== String(receipt.sizeBytes) ||
        head.contentType !== receipt.mimeType) return false;
    const annotation = head.metadata;
    return annotation["sha256"]?.toLowerCase() === receipt.sha256Hex.toLowerCase() &&
      annotation["owner-membership-id"]?.toLowerCase() === receipt.owningMembershipId.toLowerCase() &&
      annotation["college-id"]?.toLowerCase() === expectedCollegeId &&
      annotation["malware-scan-status"] === "CLEAN" &&
      annotation["scan-attested-by"] === "lms-vnext-privileged-scanner";
  } catch {
    return false;
  }
}
