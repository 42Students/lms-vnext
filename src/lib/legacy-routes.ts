/**
 * Every old path we still answer, in one table: where it used to be, where it goes now, why, and the date it can be deleted.
 * `kind: "redirect"` entries feed next.config.ts; `kind: "compat"` entries are API paths served by an adapter route.
 * A unit test fails once a removal date has passed, so old paths cannot linger unnoticed.
 */
export type LegacyRoute = {
  from: string;
  to: string;
  kind: "redirect" | "compat";
  reason: string;
  /** ISO date (yyyy-mm-dd) on/after which this entry must be deleted. */
  removeOn: string;
};

const MENTOR_RETIRED = "Mentor area retired this page; old bookmarks land on the projects list.";

const mentorRedirects = ["/mentor/profile", "/mentor/contacts", "/mentor/allQuizzes", "/mentor/fileExplorer", "/mentor/courses", "/mentor/quizzes", "/mentor/files"].flatMap(
  (from): LegacyRoute[] => [
    { from, to: "/mentor/projects", kind: "redirect", reason: MENTOR_RETIRED, removeOn: "2027-06-30" },
    ...(from === "/mentor/profile" ? [] : [{ from: `${from}/:path*`, to: "/mentor/projects", kind: "redirect" as const, reason: MENTOR_RETIRED, removeOn: "2027-06-30" }]),
  ],
);

export const LEGACY_ROUTES: readonly LegacyRoute[] = [
  ...mentorRedirects,
  { from: "/teacher/fileExplorer", to: "/teacher/courses", kind: "redirect", reason: "Faculty bookmarks must resolve before authorization on /teacher/courses.", removeOn: "2027-06-30" },
  { from: "/api/v2/skills/:legacyPath*", to: "/api/skills", kind: "compat", reason: "Old skills client keeps its v2 response shape through the adapter route.", removeOn: "2027-03-31" },
];

export function legacyRedirects(): Array<{ source: string; destination: string; permanent: false }> {
  return LEGACY_ROUTES.filter((r) => r.kind === "redirect").map((r) => ({ source: r.from, destination: r.to, permanent: false as const }));
}

/** Entries whose removal date has arrived. */
export function expiredLegacyRoutes(today: Date = new Date()): LegacyRoute[] {
  const day = today.toISOString().slice(0, 10);
  return LEGACY_ROUTES.filter((r) => r.removeOn <= day);
}
