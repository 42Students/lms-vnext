import {
  hasActiveRecruiter,
  hasMembershipRole,
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";

export type ShellNavItem = {
  label: string;
  href: string;
  shortLabel: string;
};

const dashboard: ShellNavItem = {
  label: "Dashboard",
  href: "/dashboard",
  shortLabel: "D",
};

const superAdminItems: ShellNavItem[] = [
  dashboard,
  { label: "Organizations", href: "/admin/organizations", shortLabel: "O" },
  { label: "Colleges", href: "/admin/colleges", shortLabel: "C" },
  { label: "Departments", href: "/admin/departments", shortLabel: "D" },
  { label: "Academics", href: "/admin/academics", shortLabel: "A" },
  { label: "Courses", href: "/admin/courses", shortLabel: "C" },
  { label: "Projects", href: "/admin/projects", shortLabel: "P" },
  { label: "Placements", href: "/admin/placements", shortLabel: "P" },
  { label: "People", href: "/admin/people", shortLabel: "P" },
  { label: "Domains", href: "/admin/domains", shortLabel: "D" },
  { label: "Activity", href: "/activity", shortLabel: "A" },
];

const learnerItems: ShellNavItem[] = [
  {
    label: "My Courses",
    href: "/learn/courses",
    shortLabel: "C",
  },
  {
    label: "My Projects",
    href: "/learn/projects",
    shortLabel: "P",
  },
  {
    label: "Placements",
    href: "/learn/placements",
    shortLabel: "P",
  },
];

const facultyItems: ShellNavItem[] = [
  {
    label: "Teaching Courses",
    href: "/teach/courses",
    shortLabel: "T",
  },
];

const mentorItems: ShellNavItem[] = [
  {
    label: "Mentoring Projects",
    href: "/mentor/projects",
    shortLabel: "P",
  },
];

const tpoItems: ShellNavItem[] = [
  {
    label: "Placement Operations",
    href: "/tpo/placements",
    shortLabel: "P",
  },
];

const recruiterItems: ShellNavItem[] = [
  {
    label: "Hiring Workspace",
    href: "/hr/placements",
    shortLabel: "H",
  },
];

const collegeAdminItems: ShellNavItem[] = [
  { label: "My College", href: "/college", shortLabel: "C" },
  { label: "Departments", href: "/college/departments", shortLabel: "D" },
  { label: "Academics", href: "/college/academics", shortLabel: "A" },
  { label: "Courses", href: "/college/courses", shortLabel: "C" },
  { label: "Projects", href: "/college/projects", shortLabel: "P" },
  { label: "Placements", href: "/college/placements", shortLabel: "P" },
  { label: "People", href: "/college/people", shortLabel: "P" },
  { label: "Domains", href: "/college/domains", shortLabel: "D" },
  { label: "Activity", href: "/activity", shortLabel: "A" },
];

function pushUnique(
  target: ShellNavItem[],
  additions: readonly ShellNavItem[],
) {
  for (const item of additions) {
    if (!target.some((current) => current.href === item.href)) {
      target.push(item);
    }
  }
}

function getMembershipWorkspaces(context: RequestContext) {
  const items: ShellNavItem[] = [];

  if (hasMembershipRole(context, "LEARNER")) {
    pushUnique(items, learnerItems);
  }

  if (hasMembershipRole(context, "FACULTY")) {
    pushUnique(items, facultyItems);
  }

  if (hasMembershipRole(context, "MENTOR")) {
    pushUnique(items, mentorItems);
  }

  if (hasMembershipRole(context, "TPO")) {
    pushUnique(items, tpoItems);
  }

  return items;
}

export function getShellNavigation(context: RequestContext) {
  if (isSuperAdmin(context)) {
    return superAdminItems;
  }

  const items: ShellNavItem[] = [dashboard];

  if (hasActiveRecruiter(context)) {
    pushUnique(items, recruiterItems);
  }

  // Membership roles are additive. A College Admin may also teach,
  // mentor or learn, so those workspaces must not disappear merely
  // because the membership also carries COLLEGE_ADMIN.
  pushUnique(items, getMembershipWorkspaces(context));

  if (hasMembershipRole(context, "COLLEGE_ADMIN")) {
    pushUnique(items, collegeAdminItems);
  }

  return items;
}

export function getShellRoleLabel(context: RequestContext) {
  if (isSuperAdmin(context)) {
    return "Super Admin";
  }

  if (!context.membership) {
    return hasActiveRecruiter(context)
      ? "Employer Recruiter"
      : "Select membership";
  }

  const labels = context.membership.roles.map(
    (role) =>
      role === "TPO"
        ? "TPO"
        : role
            .toLowerCase()
            .split("_")
            .map(
              (part) =>
                part.charAt(0).toUpperCase() +
                part.slice(1),
            )
            .join(" "),
  );

  if (hasActiveRecruiter(context)) {
    labels.push("Employer Recruiter");
  }

  return labels.join(" · ");
}
