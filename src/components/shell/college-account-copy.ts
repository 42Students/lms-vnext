export type AccountMenuVariant =
  | "superAdmin"
  | "collegeAdmin"
  | "tpo"
  | "faculty"
  | "learner"
  | "recruiter"
  | "other";

/**
 * Exact legacy account-menu copy (legacy-copy-A.md profiledropdown.js and
 * SuperAdminProfileDropdown.js): `My Account` + `Logout`; Super Admin shows
 * `Logout` only. Roles without a profile page (Mentor, multi-role fallbacks)
 * keep the working /account/security route behind `My Account`.
 */
export function accountActionCopy(variant: AccountMenuVariant) {
  const signOutLabel = "Logout";
  switch (variant) {
    case "superAdmin":
      return { accountLabel: null, accountHref: null, signOutLabel };
    case "collegeAdmin":
      return { accountLabel: "My Account", accountHref: "/college/profile", signOutLabel };
    case "tpo":
      return { accountLabel: "My Account", accountHref: "/tpo/profile", signOutLabel };
    case "faculty":
      return { accountLabel: "My Account", accountHref: "/teacher/profile", signOutLabel };
    case "learner":
      return { accountLabel: "My Account", accountHref: "/learn/profile", signOutLabel };
    case "recruiter":
      return { accountLabel: "My Account", accountHref: "/hr/profile", signOutLabel };
    default:
      return { accountLabel: "My Account", accountHref: "/account/security", signOutLabel };
  }
}

export function accountMenuVariant(input: {
  superAdmin: boolean;
  roles: readonly string[];
  recruiterOnly: boolean;
}): AccountMenuVariant {
  if (input.superAdmin) return "superAdmin";
  if (input.recruiterOnly) return "recruiter";
  if (input.roles.includes("COLLEGE_ADMIN")) return "collegeAdmin";
  if (input.roles.includes("TPO")) return "tpo";
  if (input.roles.includes("FACULTY")) return "faculty";
  if (input.roles.includes("LEARNER")) return "learner";
  return "other";
}
