import {
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
  { label: "People", href: "/admin/people", shortLabel: "P" },
  { label: "Domains", href: "/admin/domains", shortLabel: "D" },
];

const learnerItem: ShellNavItem = {
  label: "My Courses",
  href: "/learn/courses",
  shortLabel: "C",
};

const learnerProjectsItem: ShellNavItem = {
  label: "My Projects",
  href: "/learn/projects",
  shortLabel: "P",
};

const mentorProjectsItem: ShellNavItem = {
  label: "Mentoring Projects",
  href: "/mentor/projects",
  shortLabel: "P",
};

const facultyItem: ShellNavItem = {
  label: "Teaching Courses",
  href: "/teach/courses",
  shortLabel: "T",
};

const collegeAdminItems: ShellNavItem[] = [
  dashboard,
  { label: "My College", href: "/college", shortLabel: "C" },
  { label: "Departments", href: "/college/departments", shortLabel: "D" },
  { label: "Academics", href: "/college/academics", shortLabel: "A" },
  { label: "Courses", href: "/college/courses", shortLabel: "C" },
  { label: "Projects", href: "/college/projects", shortLabel: "P" },
  { label: "People", href: "/college/people", shortLabel: "P" },
  { label: "Domains", href: "/college/domains", shortLabel: "D" },
];

export function getShellNavigation(context: RequestContext) {
  if (isSuperAdmin(context)) {
    return superAdminItems;
  }

  if (hasMembershipRole(context, "COLLEGE_ADMIN")) {
    return collegeAdminItems;
  }

  const items: ShellNavItem[] = [dashboard];

  if (hasMembershipRole(context, "LEARNER")) {
    items.push(learnerItem, learnerProjectsItem);
  }

  if (hasMembershipRole(context, "FACULTY")) {
    items.push(facultyItem);
  }

  if (hasMembershipRole(context, "MENTOR")) {
    items.push(mentorProjectsItem);
  }

  return items;
}

export function getShellRoleLabel(context: RequestContext) {
  if (isSuperAdmin(context)) {
    return "Super Admin";
  }

  if (!context.membership) {
    return "Select membership";
  }

  if (context.membership.roles.includes("COLLEGE_ADMIN")) {
    return "College Admin";
  }

  return context.membership.roles
    .map((role) =>
      role
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    )
    .join(" · ");
}
