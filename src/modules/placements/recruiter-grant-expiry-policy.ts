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

/**
 * Legacy access months=0 meant a NULL end date. vNext requires a finite
 * verified expiry and deliberately never turns an imported open-ended grant
 * into a live recruiter authorization. A reviewer must pick a future end date.
 * This crosswalk is migration-only: it must not replace the live auth check.
 */
export type LegacyRecruiterGrantMigration = {
  legacyStatus:string;
  deleted:boolean;
  legacyValidUntil:Date|null;
  recruiterActive:boolean;
  collegeActive:boolean;
  capability:string;
  capabilities:readonly string[];
  verificationStatus:string|null;
};

export function classifyLegacyRecruiterGrant(
  legacy:LegacyRecruiterGrantMigration,now:Date,
):"INACTIVE"|"EXPIRED"|"REQUIRES_EXPIRY"|"REQUIRES_VERIFICATION"|"READY"{
  if(legacy.legacyStatus!=="ACTIVE"||legacy.deleted||
     !legacy.recruiterActive||!legacy.collegeActive||
     !legacy.capabilities.includes(legacy.capability))return "INACTIVE";
  if(!legacy.legacyValidUntil)return "REQUIRES_EXPIRY";
  if(!Number.isFinite(now.getTime())||
     !Number.isFinite(legacy.legacyValidUntil.getTime())||
     legacy.legacyValidUntil.getTime()<=now.getTime())return "EXPIRED";
  if(legacy.verificationStatus!=="VERIFIED")return "REQUIRES_VERIFICATION";
  return "READY";
}

/** Never invent a backfill expiry for legacy unlimited grants. */
export function legacyRecruiterAccessMonthsToValidUntil(
  grantedAt:Date,legacyMonths:number,
):Date|null{
  if(legacyMonths===0)return null;
  return recruiterGrantValidUntil(grantedAt,legacyMonths);
}
