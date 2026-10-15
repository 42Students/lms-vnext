import { createHash } from "node:crypto";

/** A per-learner random 256-bit salt is retained across submissions. */
export function stableIdentitySalt(prior: unknown, create: () => string): string {
  if (typeof prior === "string" && /^[0-9a-f]{64}$/.test(prior)) return prior;
  const generated = create();
  if (!/^[0-9a-f]{64}$/.test(generated)) throw new Error("Invalid identity fingerprint salt");
  return generated;
}

/** The secret identity number is never serialized; a namespace prevents cross-field reuse. */
export function saltedIdentityFingerprint(
  kind: "AADHAAR" | "PAN", number: string, salt: string,
): string {
  if (!/^[0-9a-f]{64}$/.test(salt)) throw new Error("Invalid identity fingerprint salt");
  return createHash("sha256").update(kind + ":" + salt + ":" + number).digest("hex");
}
