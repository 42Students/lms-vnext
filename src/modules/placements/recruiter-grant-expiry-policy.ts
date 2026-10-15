/**
 * T-S1-01: the grant's validity is independent of its ACTIVE/REVOKED audit
 * status. ACTIVE does not make an expired grant usable for authorization.
 */
export function recruiterGrantValidUntil(
  grantedAt: Date, accessMonths: number,
): Date {
  if (!Number.isInteger(accessMonths) || accessMonths < 1 || accessMonths > 60 ||
      !Number.isFinite(grantedAt.getTime())) throw new Error("INVALID_GRANT_DURATION");
  const start = new Date(grantedAt);
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth() + accessMonths;
  const targetStart = new Date(Date.UTC(year, month, 1,
    start.getUTCHours(), start.getUTCMinutes(), start.getUTCSeconds(),
    start.getUTCMilliseconds()));
  const lastDay = new Date(Date.UTC(targetStart.getUTCFullYear(),
    targetStart.getUTCMonth() + 1, 0)).getUTCDate();
  targetStart.setUTCDate(Math.min(start.getUTCDate(), lastDay));
  return targetStart;
}

/** A missing valid_until fails closed: legacy ACTIVE is not enough. */
export function recruiterGrantEffectiveAt(
  grant: { status: string; validUntil: Date | null;
    verificationStatus: string; capabilities: readonly string[] },
  now: Date,
  neededCapability?: string,
): boolean {
  return grant.status === "ACTIVE" &&
    grant.verificationStatus === "VERIFIED" &&
    grant.validUntil instanceof Date &&
    Number.isFinite(grant.validUntil.getTime()) &&
    Number.isFinite(now.getTime()) &&
    grant.validUntil.getTime() > now.getTime() &&
    (neededCapability === undefined ||
      grant.capabilities.includes(neededCapability));
}
