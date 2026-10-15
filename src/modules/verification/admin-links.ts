import { z } from "zod";
/** Tenant setup links must never point at an archived or malformed tenant. */
export function superAdminVerificationHref(collegeId: string, collegeStatus: string, organizationStatus: string) {
 if (collegeStatus !== "ACTIVE" || organizationStatus !== "ACTIVE" || !z.uuid().safeParse(collegeId).success) return null;
 return `/admin/colleges/${encodeURIComponent(collegeId)}/verification`;
}

/** Direct support drill-down; the target queue independently enforces College Admin scope. */
export function collegeLearnerVerificationHref(membershipId:string):string {
 return "/college/verification?"+new URLSearchParams({membershipId:z.string().uuid().parse(membershipId)}).toString();
}
