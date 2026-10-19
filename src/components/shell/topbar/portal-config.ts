import type { ShellNavItem } from "../shell-model";

export type TopbarPortal = "admin" | "college" | "tpo" | "hr" | "learn" | "teacher" | "mentor" | "other";
export type TopbarConfig = {
  portal: TopbarPortal;
  placeholder: string;
  searchHref: string;
  newHref: string | null;
  messagesHref: string | null;
  notificationsHref: string;
};

/** Navigation is selected by the visible portal, never by a secondary role
 * in a multi-role account. This keeps Faculty and TPO actions separate.
 */
export function topbarConfigForPath(pathname: string): TopbarConfig {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return {
    portal: "admin", placeholder: "Search colleges, people or companies",
    searchHref: "/admin/people/directory", newHref: "/admin/placements/new",
    messagesHref: null, notificationsHref: "/notifications",
  };
  if (pathname === "/college" || pathname.startsWith("/college/")) return {
    portal: "college", placeholder: "Find a course, person or project",
    searchHref: "/college/students", newHref: "/college/projects/create",
    messagesHref: null, notificationsHref: "/notifications",
  };
  if (pathname === "/tpo" || pathname.startsWith("/tpo/")) return {
    portal: "tpo", placeholder: "Find a student, recruiter or company",
    searchHref: "/tpo/students", newHref: "/tpo/placements/new",
    messagesHref: "/tpo/messages", notificationsHref: "/tpo/notifications",
  };
  if (pathname === "/hr" || pathname.startsWith("/hr/")) return {
    portal: "hr", placeholder: "Find a drive, applicant or message",
    searchHref: "/hr/drives", newHref: "/hr/drives/new",
    messagesHref: "/hr/conversations", notificationsHref: "/hr/notifications",
  };
  if (pathname === "/learn" || pathname.startsWith("/learn/")) return {
    portal: "learn", placeholder: "Search your courses",
    searchHref: "/learn/courses", newHref: null,
    messagesHref: null, notificationsHref: "/learn/notifications",
  };
  if (pathname === "/teacher" || pathname.startsWith("/teacher/")) return {
    portal: "teacher", placeholder: "Find a course or assignment",
    searchHref: "/teacher/courses", newHref: null,
    messagesHref: null, notificationsHref: "/teacher/notifications",
  };
  if (pathname === "/mentor" || pathname.startsWith("/mentor/")) return {
    portal: "mentor", placeholder: "Find projects and meetings",
    searchHref: "/mentor/projects", newHref: null,
    messagesHref: null, notificationsHref: "/mentor/notifications",
  };
  return {
    portal: "other", placeholder: "Search your workspace",
    searchHref: "/dashboard", newHref: null, messagesHref: null,
    notificationsHref: "/notifications",
  };
}

export function topbarCommands(
  pathname: string,
  navigation: readonly ShellNavItem[],
): { label: string; href: string }[] {
  const portal = topbarConfigForPath(pathname).portal;
  const prefix = portal === "other" ? "/dashboard" : "/" + portal + "/";
  const seen = new Set<string>();
  return navigation.filter(item => (
    (item.href === "/" + portal || item.href.startsWith(prefix)) &&
    !seen.has(item.href) && Boolean(seen.add(item.href))
  )).map(({ label, href }) => ({ label, href }));
}

export function topbarInitials(identityUid: string): string {
  const raw = identityUid.includes("@") ? identityUid.split("@")[0]! : identityUid;
  const words = raw.replace(/[._-]+/g, " ").trim().split(/\s+/)
    .filter(part => /^[a-z]/i.test(part));
  if (!words.length) return "42";
  return (words.length > 1 ? words[0]![0]! + words[words.length - 1]![0]! :
    words[0]!.slice(0, 2)).toUpperCase();
}
