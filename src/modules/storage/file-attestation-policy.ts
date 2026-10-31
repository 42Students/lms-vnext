/**
 * Persisted private-file trust boundary. READY is a workflow state, not
 * proof that the object's tenant, bytes and scanner were ever attested.
 * Production accepts only the privileged scanner. Development/test may also
 * accept the explicit non-production attestation ID; an absent APP_ENV is
 * production-like and fails closed.
 *
 * This guard is deliberately pure and used after a scoped DB row is loaded,
 * not as a replacement for membership authorization or a signed R2 grant.
 */
export type AssignmentFileAttestation = {
  status: string;
  scanStatus: string;
  scanAttestedBy: string | null;
  scanAttestedAt: Date | null;
  completedAt: Date | null;
  objectGeneration: string | null;
  verifiedContentType: string | null;
  verifiedSizeBytes: number | null;
  sha256Hex: string | null;
  declaredContentType: string;
  declaredSizeBytes: number;
};

export const PRIVILEGED_FILE_SCANNER = "lms-vnext-privileged-scanner";
export const NON_PRODUCTION_FILE_ATTESTATION = "lms-vnext-dev-attestation";

export function assignmentFileAttestationUsable(
  file: AssignmentFileAttestation,
  env: Pick<NodeJS.ProcessEnv, "APP_ENV"> = process.env,
  now = new Date(),
): boolean {
  if (file.status !== "READY" || file.scanStatus !== "CLEAN") return false;
  const nonProduction = env.APP_ENV === "development" || env.APP_ENV === "test";
  if (file.scanAttestedBy !== PRIVILEGED_FILE_SCANNER &&
    !(nonProduction && file.scanAttestedBy === NON_PRODUCTION_FILE_ATTESTATION)) return false;
  if (!file.scanAttestedAt || !file.completedAt ||
      !Number.isFinite(file.scanAttestedAt.getTime()) ||
      !Number.isFinite(file.completedAt.getTime()) ||
      file.scanAttestedAt.getTime() > now.getTime() ||
      file.completedAt.getTime() < file.scanAttestedAt.getTime()) return false;
  if (!file.objectGeneration || !/^[0-9]+$/.test(file.objectGeneration)) return false;
  if (!file.verifiedContentType ||
      file.verifiedContentType !== file.declaredContentType ||
      !Number.isSafeInteger(file.verifiedSizeBytes) ||
      file.verifiedSizeBytes !== file.declaredSizeBytes ||
      file.declaredSizeBytes <= 0) return false;
  // Assignment files are capped at 50 MiB and attested with a full SHA-256.
  return typeof file.sha256Hex === "string" && /^[0-9a-f]{64}$/.test(file.sha256Hex);
}
