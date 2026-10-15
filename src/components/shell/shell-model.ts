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
  { label: "Feature Controls", href: "/admin/features", shortLabel: "F" },
  { label: "Departments", href: "/admin/departments", shortLabel: "D" },
  { label: "Academics", href: "/admin/academics", shortLabel: "A" },
  { label: "Lecture Halls", href: "/admin/lecture-halls", shortLabel: "L" },
  { label: "Attendance", href: "/admin/attendance", shortLabel: "T" },
  { label: "Courses", href: "/admin/courses", shortLabel: "C" },
  { label: "Projects", href: "/admin/projects", shortLabel: "P" },
  { label: "Placements", href: "/admin/placements", shortLabel: "P" },
  {
    label: "Placement Interview Calendar",
    href: "/admin/placements/calendar",
    shortLabel: "C",
    icon: "/assets/images/common/calender.svg",
  },
  { label: "Recruiter Accounts", href: "/admin/recruiters", shortLabel: "R" },
  { label: "Announcements", href: "/admin/announcements", shortLabel: "A" },
  { label: "People", href: "/admin/people", shortLabel: "P" },
  { label: "Domains", href: "/admin/domains", shortLabel: "D" },
  { label: "Settings", href: "/admin/settings", shortLabel: "S" },
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
    href: "/teacher/courses",
    shortLabel: "C",
    icon: "/assets/images/common/courses.svg",
    activeIcon: "/assets/images/common/course.svg",
    group: "learning",
  },
  {
    label: "Contacts",
    href: "/teacher/contacts/allContacts",
    shortLabel: "C",
    group: "account",
  },
  {
    label: "Notifications",
    href: "/teacher/notifications",
    shortLabel: "N",
    icon: "/assets/images/common/notification.svg",
    group: "account",
  },
  {
    label: "Class Schedule",
    href: "/teacher/calendar",
    shortLabel: "S",
    icon: "/assets/images/common/calender.svg",
    group: "tracking",
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
    label: "Profile",
    href: "/teacher/profile",
    shortLabel: "R",
    icon: "/assets/images/common/myAccount.svg",
    group: "account",
  },
];

const mentorItems: ShellNavItem[] = [
  { label: "Projects", href: "/mentor/projects", shortLabel: "P", icon: "/assets/images/common/folder.svg", group: "learning" },
  { label: "Meetings", href: "/mentor/calendar", shortLabel: "M", icon: "/assets/images/common/calender.svg", group: "tracking" },
  { label: "Notifications", href: "/mentor/notifications", shortLabel: "N", icon: "/assets/images/common/notification.svg", group: "account" },
];

const tpoItems: ShellNavItem[] = [
  { label: "Recruiter Leads", href: "/tpo/recruiters", shortLabel: "R" },
  {
    label: "Companies",
    href: "/tpo/companies",
    shortLabel: "C",
  },
  {
    label: "Placement Operations",
    href: "/tpo/placements",
    shortLabel: "P",
  },
  {
    label: "Students",
    href: "/tpo/students",
    shortLabel: "S",
  },
  {
    label: "Calendar",
    href: "/tpo/calendar",
    shortLabel: "C",
    icon: "/assets/images/common/calender.svg",
  },
  {
    label: "Reports",
    href: "/tpo/reports",
    shortLabel: "R",
    group: "tracking",
  },
  {
    label: "Messages",
    href: "/tpo/messages",
    shortLabel: "M",
    group: "account",
  },
  {
    label: "Settings",
    href: "/tpo/settings",
    shortLabel: "S",
    group: "account",
  },
  {
    label: "Audit Log",
    href: "/tpo/audit",
    shortLabel: "A",
    group: "tracking",
  },
  {
    label: "More",
    href: "/tpo/more",
    shortLabel: "M",
    group: "account",
  },
];

const recruiterItems: ShellNavItem[] = [
  {
    label: "Today",
    href: "/hr/home",
    shortLabel: "T",
  },
  {
    label: "Hiring Workspace",
    href: "/hr/placements",
    shortLabel: "H",
  },
  {
    label: "Calendar",
    href: "/hr/calendar",
    shortLabel: "C",
    icon: "/assets/images/common/calender.svg",
    group: "tracking",
  },
  {
    label: "Company & Team",
    href: "/hr/company",
    shortLabel: "C",
    group: "account",
  },
  {
    label: "Profile",
    href: "/hr/profile",
    shortLabel: "P",
    group: "account",
  },
];

const collegeAdminItems: ShellNavItem[] = [
  { label: "My College", href: "/college", shortLabel: "C" },
  { label: "College Contact", href: "/college/college-profile", shortLabel: "C" },
  { label: "Departments", href: "/college/departments", shortLabel: "D" },
  { label: "Academics", href: "/college/academics", shortLabel: "A" },
  { label: "Semesters", href: "/college/semesters", shortLabel: "S" },
  { label: "Batches", href: "/college/batches", shortLabel: "B" },
  { label: "Batch Promotion Preview", href: "/college/batch-promotion", shortLabel: "P" },
  { label: "Classes", href: "/college/classes", shortLabel: "C" },
  { label: "Electives", href: "/college/electives", shortLabel: "E" },
  { label: "Semester Courses", href: "/college/semester-courses", shortLabel: "S" },
  { label: "Faculty Assignment", href: "/college/faculty-assignment", shortLabel: "F" },
  { label: "Lecture Halls", href: "/college/lecture-halls", shortLabel: "L" },
  { label: "Attendance", href: "/college/attendance", shortLabel: "T" },
  { label: "Attendance by Department", href: "/college/attendance/departments", shortLabel: "A" },
  { label: "Courses", href: "/college/courses", shortLabel: "C" },
  { label: "Lessons", href: "/college/lessons", shortLabel: "L" },
  { label: "Videos", href: "/college/videos", shortLabel: "V" },
  { label: "Resources", href: "/college/resources", shortLabel: "R" },
  { label: "Course Progress", href: "/college/course-progress", shortLabel: "P" },
  { label: "Assignments", href: "/college/assignments", shortLabel: "A" },
  { label: "Quizzes", href: "/college/quizzes", shortLabel: "Q" },
  { label: "Projects", href: "/college/projects", shortLabel: "P" },
  { label: "Placements", href: "/college/placements", shortLabel: "P" },
  { label: "Placement Evidence", href: "/college/placements/readiness-by-department", shortLabel: "R" },
  {
    label: "Placement Calendar",
    href: "/college/placements/calendar",
    shortLabel: "C",
    icon: "/assets/images/common/calender.svg",
  },
  { label: "People", href: "/college/people", shortLabel: "P" },
  { label: "Faculty", href: "/college/faculty", shortLabel: "F" },
  { label: "Students", href: "/college/students", shortLabel: "S" },
  { label: "Student Groups", href: "/college/groups", shortLabel: "G" },
  { label: "Domains", href: "/college/domains", shortLabel: "D" },
  { label: "Activity Log", href: "/college/activity", shortLabel: "A" },
  { label: "Activity", href: "/activity", shortLabel: "A" },
  { label: "My Profile", href: "/college/profile", shortLabel: "P" },
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
    // Legacy Mentor/Admin profiles are distinct routes; do not render a
    // Faculty-only profile link for those multi-role memberships.
    pushUnique(
      items,
      hasMembershipRole(context, "MENTOR") || hasMembershipRole(context, "COLLEGE_ADMIN")
        ? facultyItems.filter((item) => item.href !== "/teacher/profile")
        : facultyItems,
    );
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

  // A teaching-only Faculty account uses the legacy seven-entry sidebar,
  // without a generic Dashboard. Mixed-role memberships stay additive.
  if (
    context.membership &&
    context.membership.roles.length === 1 &&
    hasMembershipRole(context, "FACULTY") &&
    !hasActiveRecruiter(context)
  ) {
    return facultyItems;
  }

  // Mentor-only accounts use their legacy three-surface sidebar without a generic Dashboard.
  if (
    context.membership &&
    context.membership.roles.length === 1 &&
    hasMembershipRole(context, "MENTOR") &&
    !hasActiveRecruiter(context)
  ) {
    return mentorItems;
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

  return qualifyDuplicateLabels(items);
}

const PORTAL_QUALIFIERS: readonly (readonly [string, string])[] = [
  ["/learn", "Learning"],
  ["/teach", "Teaching"],
  ["/teacher", "Teaching"],
  ["/mentor", "Mentoring"],
  ["/college", "College"],
  ["/admin", "Admin"],
  ["/tpo", "Placements"],
  ["/hr", "Recruiting"],
];

function portalQualifier(href: string) {
  return (
    PORTAL_QUALIFIERS.find(
      ([prefix]) =>
        href === prefix || href.startsWith(`${prefix}/`),
    )?.[1] ?? null
  );
}

/**
 * A person with several roles gets every role's sidebar entries, so labels
 * like "Courses" or "Notifications" can appear twice with different
 * destinations. Only labels that actually collide are qualified by the area
 * they open ("Courses · Teaching"); everything else, and every single-role
 * sidebar, keeps its legacy label.
 */
export function qualifyDuplicateLabels(
  items: readonly ShellNavItem[],
): ShellNavItem[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.label, (counts.get(item.label) ?? 0) + 1);
  }

  return items.map((item) => {
    if ((counts.get(item.label) ?? 0) < 2) return item;
    const qualifier = portalQualifier(item.href);
    return qualifier
      ? { ...item, label: `${item.label} · ${qualifier}` }
      : item;
  });
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
