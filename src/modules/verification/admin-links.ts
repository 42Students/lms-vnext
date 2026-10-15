import { z } from "zod";
/** Tenant setup links must never point at an archived or malformed tenant. */
export function superAdminVerificationHref(collegeId: string, collegeStatus: string, organizationStatus: string) {
 if (collegeStatus !== "ACTIVE" || organizationStatus !== "ACTIVE" || !z.uuid().safeParse(collegeId).success) return null;
 return `/admin/colleges/${encodeURIComponent(collegeId)}/verification`;
}
