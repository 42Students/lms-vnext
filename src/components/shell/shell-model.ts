import {
  hasActiveRecruiter,
  hasMembershipRole,
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";

export type LearnerNavigationAccess = {
  projectsEnabled: boolean;
  placementsEnabled: boolean;
  driveDayEnabled?: boolean;
};

export type ShellNavItem = {
  label: string;
  href: string;
  shortLabel: string;
  icon?: string;
  activeIcon?: string;
  group?: "learning" | "tracking" | "career" | "account";
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
  { label: "Attendance", href: "/admin/attendance", shortLabel: "T" },
  { label: "Courses", href: "/admin/courses", shortLabel: "C" },
  { label: "Projects", href: "/admin/projects", shortLabel: "P" },
  { label: "Placements", href: "/admin/placements", shortLabel: "P" },
  { label: "People", href: "/admin/people", shortLabel: "P" },
  { label: "Domains", href: "/admin/domains", shortLabel: "D" },
  { label: "Activity", href: "/activity", shortLabel: "A" },
];

const learnerItems: ShellNavItem[] = [
  {
    label: "Courses",
    href: "/learn/courses",
    shortLabel: "C",
    icon: "/assets/images/common/courses.svg",
    activeIcon: "/assets/images/common/course.svg",
    group: "learning",
  },
  {
    label: "Quizzes",
    href: "/learn/allQuizzes",
    shortLabel: "Q",
    icon: "/assets/images/common/quiz.svg",
    activeIcon: "/assets/images/common/quiz-active.svg",
    group: "learning",
  },
  {
    label: "Assignments",
    href: "/learn/allAssignments",
    shortLabel: "A",
    icon: "/assets/images/common/assignment.svg",
    activeIcon: "/assets/images/common/assignment-active.svg",
    group: "learning",
  },
  {
    label: "Class Schedule",
    href: "/learn/calendar",
    shortLabel: "S",
    icon: "/assets/images/common/calender.svg",
    group: "tracking",
  },
  {
    label: "Attendance",
    href: "/learn/attendance",
    shortLabel: "T",
    icon: "/assets/images/common/attendance.svg",
    group: "tracking",
  },
  {
    label: "My Placements",
    href: "/learn/my-placements",
    shortLabel: "P",
    icon: "/assets/images/common/book-open.svg",
    group: "career",
  },
  {
    label: "Projects",
    href: "/learn/projects",
    shortLabel: "P",
    icon: "/assets/images/common/folder.svg",
    group: "learning",
  },
  {
    label: "Notifications",
    href: "/learn/notifications",
    shortLabel: "N",
    icon: "/assets/images/common/notification.svg",
    group: "account",
  },
  {
    label: "Profile",
    href: "/learn/profile",
    shortLabel: "R",
    icon: "/assets/images/common/myAccount.svg",
    group: "account",
  },
];

const facultyItems: ShellNavItem[] = [
  {
    label: "Courses",
    href: "/teach/courses",
    shortLabel: "C",
    group: "learning",
  },
  {
    label: "Contacts",
    href: "/teacher/contacts/allContacts",
    shortLabel: "C",
    group: "account",
  },
  {
    label: "All Quizzes",
    href: "/teacher/allQuizzes",
    shortLabel: "Q",
    icon: "/assets/images/common/quiz.svg",
    activeIcon: "/assets/images/common/quiz-active.svg",
    group: "learning",
  },
  {
    label: "All Assignments",
    href: "/teacher/allAssignments",
    shortLabel: "A",
    icon: "/assets/images/common/assignment.svg",
    activeIcon: "/assets/images/common/assignment-active.svg",
    group: "learning",
  },
  {
    label: "Class Schedule",
    href: "/teacher/calendar",
    shortLabel: "S",
    icon: "/assets/images/common/calender.svg",
    group: "tracking",
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
  { label: "Recruiter Leads", href: "/tpo/recruiters", shortLabel: "R" },
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
  { label: "Attendance", href: "/college/attendance", shortLabel: "T" },
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

function getLearnerItems(
  access?: LearnerNavigationAccess | null,
) {
  if (!access) return learnerItems;

  const items = learnerItems.filter((item) => {
    if (
      item.href === "/learn/projects" &&
      !access.projectsEnabled
    ) {
      return false;
    }
    if (
      item.href === "/learn/my-placements" &&
      !access.placementsEnabled
    ) {
      return false;
    }
    return true;
  });

  if (access.driveDayEnabled) {
    return [
      ...items,
      {
        label: "Drive Day",
        href: "/tpo/drive-day",
        shortLabel: "D",
        group: "career" as const,
      },
    ];
  }

  return items;
}

function getMembershipWorkspaces(
  context: RequestContext,
  learnerAccess?: LearnerNavigationAccess | null,
) {
  const items: ShellNavItem[] = [];

  if (hasMembershipRole(context, "LEARNER")) {
    pushUnique(items, getLearnerItems(learnerAccess));
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

export function getShellNavigation(
  context: RequestContext,
  learnerAccess?: LearnerNavigationAccess | null,
) {
  if (isSuperAdmin(context)) {
    return superAdminItems;
  }

  // Clone-first parity: a learner-only membership gets the exact legacy
  // learner sidebar contract — no generic Dashboard row and no vNext-only
  // renaming. Multi-role memberships remain additive until their account
  // switch/navigation contract is migrated in its own parity pass.
  if (
    context.membership &&
    context.membership.roles.length === 1 &&
    hasMembershipRole(context, "LEARNER") &&
    !hasActiveRecruiter(context)
  ) {
    return getLearnerItems(learnerAccess);
  }

  const items: ShellNavItem[] = [dashboard];

  if (hasActiveRecruiter(context)) {
    pushUnique(items, recruiterItems);
  }

  // Membership roles are additive. A College Admin may also teach,
  // mentor or learn, so those workspaces must not disappear merely
  // because the membership also carries COLLEGE_ADMIN.
  pushUnique(
    items,
    getMembershipWorkspaces(context, learnerAccess),
  );

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
