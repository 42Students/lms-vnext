export const ORGANIZATION_STATUSES = ["ACTIVE", "ARCHIVED"] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export const COLLEGE_STATUSES = ["ACTIVE", "ARCHIVED"] as const;
export type CollegeStatus = (typeof COLLEGE_STATUSES)[number];

export const USER_PLATFORM_STATUSES = ["ACTIVE", "DISABLED"] as const;
export type UserPlatformStatus = (typeof USER_PLATFORM_STATUSES)[number];

export const MEMBERSHIP_STATUSES = [
  "ACTIVE",
  "SUSPENDED",
  "ENDED",
] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const MEMBERSHIP_ROLES = [
  "LEARNER",
  "FACULTY",
  "COLLEGE_ADMIN",
  "MENTOR",
  "TPO",
] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const SYSTEM_ROLES = ["SUPER_ADMIN"] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];
/**
 * Legacy role labels are migration inputs, never a runtime authorization grant.
 * Generic USER, missing and unknown values must not default to LEARNER.
 */
export type LegacyAccountRoleResolution =
  | { kind: "SYSTEM"; role: SystemRole }
  | { kind: "MEMBERSHIP"; role: MembershipRole }
  | { kind: "RECRUITER_PROFILE"; role: "RECRUITER" }
  | { kind: "UNMAPPED" };

export function resolveLegacyAccountRole(
  rawRole: string | null | undefined,
  rawFacultyType?: string | null,
): LegacyAccountRoleResolution {
  const role = rawRole?.trim().toUpperCase();
  const facultyType = rawFacultyType?.trim().toUpperCase();
  if (role === "SUPER_ADMIN") return { kind: "SYSTEM", role: "SUPER_ADMIN" };
  if (role === "ADMIN" || (role === "FACULTY" && facultyType === "ADMIN")) {
    return { kind: "MEMBERSHIP", role: "COLLEGE_ADMIN" };
  }
  if (role === "TPO" || (role === "FACULTY" && facultyType === "TPO")) {
    return { kind: "MEMBERSHIP", role: "TPO" };
  }
  if (role === "MENTOR") return { kind: "MEMBERSHIP", role: "MENTOR" };
  if (role === "FACULTY") return { kind: "MEMBERSHIP", role: "FACULTY" };
  if (role === "LEARNER") return { kind: "MEMBERSHIP", role: "LEARNER" };
  if (role === "RECRUITER") return { kind: "RECRUITER_PROFILE", role: "RECRUITER" };
  return { kind: "UNMAPPED" };
}

/** UI labels are intentionally distinct from storage enum names.
 * No text label is sufficient to authorize a role. */
export const MEMBERSHIP_ROLE_LABELS:Readonly<Record<MembershipRole,string>>={
 LEARNER:"Learner",FACULTY:"Faculty",COLLEGE_ADMIN:"College Admin",
 MENTOR:"Mentor",TPO:"Placement Officer",
};
export const SYSTEM_ROLE_LABELS:Readonly<Record<SystemRole,string>>={
 SUPER_ADMIN:"Super Admin",
};
export const MEMBERSHIP_ROLE_DISPLAY_ORDER:readonly MembershipRole[]=[
 "LEARNER","FACULTY","MENTOR","TPO","COLLEGE_ADMIN",
];
export function canonicalMembershipRoles(raw:readonly string[]):MembershipRole[]|null{
 const roles:MembershipRole[]=[];
 for(const item of raw){
  const role=item.trim().toUpperCase();
  if(!MEMBERSHIP_ROLES.includes(role as MembershipRole)||roles.includes(role as MembershipRole))
    return null;
  roles.push(role as MembershipRole);
 }
 return roles.length?MEMBERSHIP_ROLE_DISPLAY_ORDER.filter(role=>roles.includes(role)):null;
}
