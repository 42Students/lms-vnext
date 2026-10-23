import { saltedIdentityFingerprint } from "@/modules/profile-verification/identity-fingerprint";

/** Only a yes/no result leaves this server-side projection; never send identity
 * fingerprints, raw numbers, private receipt references, or the salt to the UI.
 * Older snapshots without comparable salted hashes report "unknown" instead
 * of incorrectly claiming that a verified identity is unchanged.
 */
export function learnerVerifiedIdentityChanged(
  verifiedSnapshot: unknown,
  current: { aadhaarNumber: string; panNumber: string },
): boolean | null {
  if (!verifiedSnapshot || typeof verifiedSnapshot !== "object" ||
      Array.isArray(verifiedSnapshot)) return null;
  const stored = verifiedSnapshot as Record<string, unknown>;
  const salt = stored["identityHashSalt"];
  if (typeof salt !== "string" || !/^[0-9a-f]{64}$/.test(salt)) return null;

  const fields = [
    {name:"AADHAAR" as const, number:current.aadhaarNumber,
     masked:stored["aadhaarNumber"], hash:stored["aadhaarHash"]},
    {name:"PAN" as const, number:current.panNumber,
     masked:stored["panNumber"], hash:stored["panHash"]},
  ];
  for (const field of fields) {
    if (field.hash === undefined || field.hash === null) {
      // A blank submitted identifier has no hash; a nonblank legacy masked
      // identifier without a hash is not comparable.
      if (field.masked !== "") return null;
      if (field.number.trim() !== "") return true;
      continue;
    }
    if (typeof field.hash !== "string" || !/^[0-9a-f]{64}$/.test(field.hash))
      return null;
    if (!field.number.trim() ||
        saltedIdentityFingerprint(field.name, field.number, salt) !== field.hash)
      return true;
  }
  return false;
}
