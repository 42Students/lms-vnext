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

export type ShellNavIconName =
 | "home" | "dashboard" | "school" | "building" | "sliders"
 | "puzzle" | "settings" | "history" | "mail" | "book"
 | "users" | "shield" | "briefcase" | "folder" | "calendar"
 | "checklist" | "clipboard" | "messages" | "bell" | "megaphone"
 | "chart" | "contact" | "search" | "layers" | "user"
 | "award" | "target" | "clock" | "table" | "inbox" | "help"
 | "comment" | "check-circle" | "file-text" | "wrench";

export type ShellNavItem = {
  label: string;
  href: string;
  shortLabel: string;
  icon?: string;
  activeIcon?: string;
  group?: "learning" | "tracking" | "career" | "account" | "operate" | "coordinate" | "insights" | "administration";
};

/** User-approved TPO section headings, shared by desktop and mobile. */
export const TPO_SECTION_LABELS = {
  operate: "Operate",
  coordinate: "Coordinate",
  insights: "Insights",
  administration: "Administration",
} as const;


/** Icon keys live with route/group data, not with visual layout. The old
 * application ships image icons for some learner rows; remaining rows use
 * inline SVG because this repository does not depend on lucide-react. */
export const SHELL_NAV_ICON_KEYS:ReadOnly<Record<string,ShellNavIconName>>={
 "/dashboard":"dashboard",
 "/admin/tenants":"building", "/admin/features":"sliders",
 "/admin/module-access":"puzzle", "/admin/settings":"settings",
 "/admin/audit":"history", "/admin/inbound-mail":"mail",
 "/admin/departments":"school", "/admin/courses":"book",
 "/admin/faculty":"users", "/admin/verification":"shield",
 "/admin/placements":"briefcase", "/admin/projects/templates":"folder",
 "/learn/courses":"book", "/learn/allQuizzes":"clipboard",
 "/learn/allAssignments":"checklist", "/learn/calendar":"calendar",
 "/learn/attendance":"table", "/learn/my-placements":"briefcase",
 "/learn/projects":"folder", "/learn/notifications":"bell", "/learn/profile":"user",
 "/teacher/courses":"book", "/teacher/contacts/allContacts":"contact",
 "/teacher/notifications":"bell", "/teacher/calendar":"calendar",
 "/teacher/allQuizzes":"clipboard", "/teacher/allAssignments":"checklist",
 "/teacher/profile":"user",
 "/mentor/projects":"folder", "/mentor/calendar":"calendar",
 "/mentor/notifications":"bell",
 "/tpo/home":"dashboard", "/tpo/batches":"building", "/tpo/recruiters":"users",
 "/tpo/placements":"briefcase", "/tpo/team":"comment",
 "/tpo/students":"users", "/tpo/requests":"check-circle",
 "/tpo/verification":"shield", "/tpo/calendar":"calendar",
 "/tpo/announcements":"megaphone", "/tpo/reports":"file-text",
 "/tpo/messages":"messages", "/tpo/settings":"wrench",
 "/tpo/audit":"history", "/tpo/notifications":"bell",
 "/hr/home":"dashboard", "/hr/drives":"briefcase", "/hr/calendar":"calendar",
 "/hr/conversations":"messages", "/hr/company":"users",
 "/college":"dashboard", "/college/activity":"history",
 "/college/departments":"school", "/college/courses":"book",
 "/college/faculty":"users", "/college/verification":"shield",
 "/college/placements":"briefcase", "/college/projects":"folder",
 "/college/profile":"user",
};
export function shellNavIconKey(item:ShellNavItem):ShellNavIconName{
 return SHELL_NAV_ICON_KEYS[item.href]??"layers";
}
export const SHELL_SECTION_LABELS:ReadOnly<Record<NonNullable<ShellNavItem["group"]>,string>>={
 learning:"Learning",tracking:"Tracking",career:"Career",account:"Account",
 operate:"Operate",coordinate:"Coordinate",insights:"Insights",
 administration:"Administration",
};
/** Map a navigation destination to its owning legacy account portal. */
function navPortal(href: string): string | null {
 if (href === "/dashboard") return null;
 if (href === "/college" || href.startsWith("/college/")) return "college";
 if (href === "/recruiter" || href.startsWith("/recruiter/")) return "hr";
 for (const prefix of ["teacher", "tpo", "learn", "mentor", "hr", "admin"]) {
  if (href === `/${prefix}` || href.startsWith(`/${prefix}/`)) return prefix;
 }
 return null;
}

/** The old LMS mounts one account sidebar at a time. Multiple memberships
 * must not combine learner, mentor, teacher, TPO and recruiter menus.
 * Single-role college admins retain their one explicit Placement cell link.
 * The general Dashboard link remains a safe cross-workspace escape. */
export function scopedShellNavigation(items: readonly ShellNavItem[], pathname: string): ShellNavItem[] {
 const portals = [...new Set(items.map(item => navPortal(item.href)).filter(
  (portal): portal is string => portal !== null
 ))];
 if (portals.length <= 1) return [...items];
 // The legacy shell displays one account's navigation at a time. A single
 // stray row from another portal must not leak into the active icon rail.
 const pathPortal = navPortal(pathname);
 const selected = pathPortal && portals.includes(pathPortal) ? pathPortal :
  portals.includes("college") ? "college" : portals[0]!;
 return items.filter(item => {
  const portal = navPortal(item.href);
  return portal === selected ||
   (selected === "college" && item.href === "/tpo/home" &&
    item.label.replace(/ · Placements$/, "") === "Placement cell");
 }).map(item => {
  const label = item.label.replace(/ · (?:Learning|Teaching|Mentoring|College|Admin|Placements|Recruiting)$/, "");
  return label === item.label ? item : {...item, label};
 });
}

const dashboard: ShellNavItem = {
  label: "Dashboard",
  href: "/dashboard",
  shortLabel: "D",
};

/** Exact legacy 13-row superAdminNavigationMenuFlat, lists.js L234–256.
 * Group boundaries render dividers after Feature Controls, Inbound mail and People.
 * Every consolidated destination has an existing Super Admin grouped strip.
 */
export const superAdminItems: ShellNavItem[] = [
  {label:"Overview",href:"/dashboard",shortLabel:"O",group:"operate"},
  {label:"Tenant Setup",href:"/admin/tenants",shortLabel:"T",group:"operate"},
  {label:"Feature Controls",href:"/admin/features",shortLabel:"F",group:"operate"},
  {label:"Module Access",href:"/admin/module-access",shortLabel:"M",group:"coordinate"},
  {label:"Tenant Settings",href:"/admin/settings",shortLabel:"S",group:"coordinate"},
  {label:"Activity Log",href:"/admin/audit",shortLabel:"A",group:"coordinate"},
  {label:"Inbound mail",href:"/admin/inbound-mail",shortLabel:"I",group:"coordinate"},
  {label:"Academic Setup",href:"/admin/departments",shortLabel:"A",group:"insights"},
  {label:"Courses & Content",href:"/admin/courses",shortLabel:"C",group:"insights"},
  {label:"People",href:"/admin/faculty",shortLabel:"P",group:"insights"},
  {label:"Profile verification",href:"/admin/verification",shortLabel:"V",group:"administration"},
  {label:"Placements",href:"/admin/placements",shortLabel:"P",group:"administration"},
  {label:"Projects",href:"/admin/projects/templates",shortLabel:"P",group:"administration"},
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
    label: "All assignments",
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
  { label: "Meetings", href: "/mentor/calendar", shortLabel: "M", icon: "/assets/images/common/calender.svg", group: "learning" },
  { label: "Notifications", href: "/mentor/notifications", shortLabel: "N", icon: "/assets/images/common/notification.svg", group: "learning" },
];

/** Exact legacy sidebar order from docs/audit/legacy-copy-B.md section A. */
export function filterTpoVerificationNav(items:readonly ShellNavItem[],enabled:boolean){
 return enabled?[...items]:items.filter(item=>item.href!=="/tpo/verification");
}

const tpoItems: ShellNavItem[] = [
  { label: "Home", href: "/tpo/home", shortLabel: "H", group: "operate" },
  { label: "Placement eligibility", href: "/tpo/batches", shortLabel: "P", group: "operate" },
  { label: "Engage", href: "/tpo/recruiters", shortLabel: "E", group: "operate" },
  { label: "Drives", href: "/tpo/placements", shortLabel: "D", group: "operate" },
  { label: "Team", href: "/tpo/team", shortLabel: "T", group: "operate" },
  { label: "Students", href: "/tpo/students", shortLabel: "S", group: "coordinate" },
  { label: "Requests", href: "/tpo/requests", shortLabel: "R", group: "coordinate" },
  { label: "Verification", href: "/tpo/verification", shortLabel: "V", group: "coordinate" },
  { label: "Calendar", href: "/tpo/calendar", shortLabel: "C", icon: "/assets/images/common/calender.svg", group: "coordinate" },
  { label: "Announcements", href: "/tpo/announcements", shortLabel: "A", group: "coordinate" },
  { label: "Reports", href: "/tpo/reports", shortLabel: "R", group: "insights" },
  { label: "Messages", href: "/tpo/messages", shortLabel: "M", group: "administration" },
  { label: "Settings", href: "/tpo/settings", shortLabel: "S", group: "administration" },
  { label: "Audit log", href: "/tpo/audit", shortLabel: "A", group: "administration" },
  { label: "Notifications", href: "/tpo/notifications", shortLabel: "N", group: "administration" },
];

/** Recruiter legacy has five sidebar rows; no generic Dashboard or Profile. */
const recruiterItems: ShellNavItem[] = [
  { label: "Today", href: "/hr/home", shortLabel: "T", group: "learning" },
  { label: "Drives", href: "/hr/drives", shortLabel: "D", group: "learning" },
  { label: "Calendar", href: "/hr/calendar", shortLabel: "C", icon: "/assets/images/common/calender.svg", group: "learning" },
  { label: "Messages", href: "/hr/conversations", shortLabel: "M", group: "learning" },
  { label: "Company & Team", href: "/hr/company", shortLabel: "C", group: "account" },
];

/** Legacy college sidebar, source: docs/audit/legacy-copy-A.md lists.js L192–212. */
export const collegeAdminItems: ShellNavItem[] = [
  { label: "Dashboard", href: "/college", shortLabel: "D", group: "operate" },
  { label: "Activity Log", href: "/college/activity", shortLabel: "A", group: "operate" },
  { label: "Academic Setup", href: "/college/departments", shortLabel: "A", group: "coordinate" },
  { label: "Courses & Content", href: "/college/courses", shortLabel: "C", group: "coordinate" },
  { label: "People", href: "/college/faculty", shortLabel: "P", group: "coordinate" },
  { label: "Profile verification", href: "/college/verification", shortLabel: "V", group: "insights" },
  { label: "Placements", href: "/college/placements", shortLabel: "P", group: "insights" },
  { label: "Placement cell", href: "/tpo/home", shortLabel: "P", group: "insights" },
  { label: "Projects", href: "/college/projects", shortLabel: "P", group: "insights" },
  { label: "Profile", href: "/college/profile", shortLabel: "P", group: "administration" },
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

  return items;
}

function getMembershipWorkspaces(
  context: RequestContext,
  learnerAccess?: LearnerNavigationAccess | null,
  tpoVerificationEnabled = false,
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
    pushUnique(items, filterTpoVerificationNav(tpoItems,tpoVerificationEnabled));
  }

  return items;
}

export function getShellNavigation(
  context: RequestContext,
  learnerAccess?: LearnerNavigationAccess | null,
  tpoVerificationEnabled = false,
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

  // A College Admin-only account uses the legacy grouped ten-item sidebar,
  // rather than exposing every vNext internal route as a separate menu item.
  if (
    context.membership &&
    context.membership.roles.length === 1 &&
    hasMembershipRole(context, "COLLEGE_ADMIN") &&
    !hasActiveRecruiter(context)
  ) {
    return collegeAdminItems;
  }

  // A TPO-only or recruiter-only account must see exactly the legacy
  // sidebar, rather than a generic Dashboard plus role-specific links.
  if (context.membership && context.membership.roles.length === 1 &&
      hasMembershipRole(context, "TPO") && !hasActiveRecruiter(context)) {
    return filterTpoVerificationNav(tpoItems,tpoVerificationEnabled);
  }
  if (!context.membership && hasActiveRecruiter(context)) {
    return recruiterItems;
  }

  const items: ShellNavItem[] = hasMembershipRole(context, "COLLEGE_ADMIN")
    ? []
    : [dashboard];

  if (hasActiveRecruiter(context)) {
    pushUnique(items, recruiterItems);
  }

  // Membership roles are additive. A College Admin may also teach,
  // mentor or learn, so those workspaces must not disappear merely
  // because the membership also carries COLLEGE_ADMIN.
  pushUnique(
    items,
    getMembershipWorkspaces(context, learnerAccess, tpoVerificationEnabled),
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
  ["/recruiter", "Recruiting"],
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
      ? "Recruiter"
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
    labels.push("Recruiter");
  }

  return labels.join(" · ");
}
