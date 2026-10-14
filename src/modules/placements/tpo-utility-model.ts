/**
 * TPO secondary navigation.
 *
 * Every destination must have a working page in the
 * authenticated TPO route group. Companies uses the
 * existing recruiter companies view: /tpo/companies
 * requires a selected name and otherwise redirects.
 */
export const TPO_MORE_GROUPS = [
  {
    heading: "Students and operations",
    description: "Daily placement oversight and follow-up.",
    links: [
      {
        label: "Students",
        href: "/tpo/students",
        description:
          "Review student placement journeys and branch intelligence.",
      },
      {
        label: "Requests",
        href: "/tpo/students/requests",
        description:
          "Review students' recorded placement requests.",
      },
      {
        label: "Calendar",
        href: "/tpo/calendar",
        description:
          "Open placement interviews and scheduled events.",
      },
      {
        label: "Reports",
        href: "/tpo/reports",
        description:
          "Explore placement performance and exportable reports.",
      },
      {
        label: "Audit Log",
        href: "/tpo/audit",
        description:
          "Review recorded placement decisions and activity.",
      },
    ],
  },
  {
    heading: "Relationships and account",
    description: "Recruiter relationships and your account.",
    links: [
      {
        label: "Companies",
        href: "/tpo/recruiters?view=companies",
        description:
          "Open the existing recruiter companies view.",
      },
      {
        label: "My Notifications",
        href: "/tpo/messages/notifications",
        description:
          "Review your own college-scoped in-app placement notifications and mark unread deliveries read.",
      },
      {
        label: "Profile",
        href: "/tpo/profile",
        description:
          "View your own college membership and profile.",
      },
    ],
  },
] as const;

export function formatTpoProfileRole(
  role: string,
): string {
  if (role === "TPO") return "TPO";

  return role
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}
