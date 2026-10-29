import { createHmac } from "node:crypto";

/**
 * DB-023 privacy-preserving incident blast-radius key. This is deliberately
 * a pure encoding of ALREADY VERIFIED application identity. It does not
 * authenticate a user or elevate a browser-provided account marker.
 *
 * Unverified or malformed IDs must contribute UNKNOWN to the blast radius;
 * never coerce a malformed college into the shared platform scope.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function deriveVerifiedAlertAccountHash(input: {
  userId: string | null | undefined;
  collegeId?: string | null;
  key: string | null | undefined;
}): string | null {
  if (!input || typeof input.userId !== "string" ||
      !UUID.test(input.userId) ||
      (input.collegeId != null &&
        (typeof input.collegeId !== "string" || !UUID.test(input.collegeId))) ||
      typeof input.key !== "string" || input.key.length < 32) {
    return null;
  }
  // One user visiting two colleges is two affected access contexts. A user
  // on the platform without a selected college has one platform context.
  // Case normalization prevents multiple hashes for the same canonical UUID.
  const scope = input.collegeId?.toLowerCase() ?? "platform";
  const canonicalUser = input.userId.toLowerCase();
  // Preserve the pre-existing scope:user identity derivation. Changing the
  // HMAC namespace without migrating historic hashes would double-count
  // existing accounts, even with the same stable secret.
  return createHmac("sha256", input.key)
    .update(scope + ":" + canonicalUser)
    .digest("hex");
}
