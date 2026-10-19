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
    searchHref: "/admin/people/directory",
    newHref: pathname.startsWith("/admin/placements") ? "/admin/placements/new" :
      pathname.startsWith("/admin/projects") ? "/admin/projects/workspaces/new" :
      pathname.startsWith("/admin/tenants") ? "/admin/tenants/create" :
      "/admin/tenants/create",
    messagesHref: null, notificationsHref: "/notifications",
  };
  if (pathname === "/college" || pathname.startsWith("/college/")) return {
    portal: "college", placeholder: "Find a course, person or project",
    searchHref: "/college/students",
    newHref: pathname.startsWith("/college/projects") ? "/college/projects/create" : null,
    messagesHref: null, notificationsHref: "/notifications",
  };
  if (pathname === "/tpo" || pathname.startsWith("/tpo/")) return {
    portal: "tpo", placeholder: "Find a student, recruiter or company",
    searchHref: "/tpo/students", newHref: "/tpo/placements/new",
    messagesHref: "/tpo/messages", notificationsHref: "/tpo/notifications",
  };
  if (pathname === "/hr" || pathname.startsWith("/hr/") || pathname === "/recruiter" || pathname.startsWith("/recruiter/")) return {
    portal: "hr", placeholder: "Find a drive, applicant or message",
    searchHref: "/hr/drives", newHref: "/hr/drives/new",
    messagesHref: "/hr/conversations", notificationsHref: "/hr/notifications",
  };
  if (pathname === "/learn" || pathname.startsWith("/learn/")) return {
    portal: "learn", placeholder: "Search your courses",
    searchHref: "/learn/courses", newHref: null,
    messagesHref: null, notificationsHref: "/learn/notifications",
  };
  if (pathname === "/teacher" || pathname.startsWith("/teacher/") || pathname === "/teach" || pathname.startsWith("/teach/")) return {
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
  const prefixes = portal === "hr" ? ["/hr/", "/recruiter/"] :
    portal === "teacher" ? ["/teacher/", "/teach/"] :
    portal === "other" ? ["/dashboard"] : ["/" + portal + "/"];
  const seen = new Set<string>();
  return navigation.filter(item => (
    (item.href === "/" + portal ||
      (portal === "hr" && item.href === "/recruiter") ||
      (portal === "teacher" && item.href === "/teach") ||
      prefixes.some(prefix => item.href.startsWith(prefix))) &&
    !seen.has(item.href) && Boolean(seen.add(item.href))
  )).map(({ label, href }) => ({ label, href }));
}

export function topbarInitials(identityUid: string, fallback = "42"): string {
  // OAuth/Firebase opaque UIDs are not names. Only derive personal initials
  // when the identity is an address; otherwise use the visible role label.
  const raw = identityUid.includes("@") ? identityUid.split("@")[0]! : fallback;
  const words = raw.replace(/[._-]+/g, " ").trim().split(/\s+/)
    .filter(part => /^[a-z]/i.test(part));
  if (!words.length) return "42";
  return (words.length > 1 ? words[0]![0]! + words[words.length - 1]![0]! :
    words[0]!.slice(0, 2)).toUpperCase();
}

/** Existing portal pages, not a cross-tenant search API. A command only
 * opens an authorized route which applies its own college/role filters.
 */
export function topbarSearchDestinations(pathname: string, text: string) {
  const query = text.trim().slice(0,100);
  if (!query) return [] as {label:string;href:string}[];
  const enc = encodeURIComponent(query);
  switch (topbarConfigForPath(pathname).portal) {
    case "tpo": return [
      {label:"Search students",href:"/tpo/students?q="+enc},
      {label:"Search recruiter leads",href:"/tpo/recruiters?q="+enc},
      {label:"Search companies",href:"/tpo/companies?search="+enc},
    ];
    case "admin": return [
      {label:"Search people",href:"/admin/people/directory?q="+enc},
      {label:"Search companies",href:"/admin/companies?q="+enc},
      {label:"Search placement drives",href:"/admin/placements/drives?q="+enc},
      {label:"Search project workspaces",href:"/admin/projects?search="+enc},
    ];
    case "hr": return [
      {label:"Search drives",href:"/hr/drives?q="+enc},
      {label:"Search conversations",href:"/hr/conversations?q="+enc},
    ];
    case "college": return [
      {label:"Search students",href:"/college/students?q="+enc},
      {label:"Search courses",href:"/college/courses?q="+enc},
    ];
    default: return [] as {label:string;href:string}[];
  }
}
