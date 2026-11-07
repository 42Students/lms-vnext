import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");
const route = (path: string) => source("src/app/(authenticated)/" + path);

describe("Five-group development acceptance fixture isolation", () => {
  it("never deploys the fixture without development and an explicit opt-in", () => {
    const page = source("src/app/e2e/ux-five-route-recovery/page.tsx");
    expect(page).toContain('process.env.NODE_ENV !== "development"');
    expect(page).toContain('process.env["UX_FIVE_ROUTE_FIXTURE"] !== "1"');
    expect(page).toContain("notFound()");
    expect(page).not.toContain("setCookie");
  });
});

describe("UX-G025 Super Admin setup/content routing and denial safety", () => {
  it("normalizes only supported legacy content filters and preserves lesson search", () => {
    const videos = route("admin/videos/page.tsx");
    expect(videos).toContain("legacySuperAdminLessonContentHref(raw)");
    expect(videos).toContain('search.set("lessonSearch", lessonSearch.trim())');
    expect(videos).toContain('search.set("lessonPage", lessonPage)');
    expect(videos).not.toContain("for(const [name,value] of Object.entries(raw))");
  });
  it("does not misrepresent an authorization denial as a transient tenant outage", () => {
    const setup = route("admin/tenants/setup/page.tsx");
    expect(setup).toContain('AuthorizationError,can,requirePermission');
    expect(setup).toContain("if(error instanceof AuthorizationError)throw error;");
    for (const result of ["r","m","si","b"])
      expect(setup).toContain('if('+result+'.status==="rejected"&&'+result+'.reason instanceof AuthorizationError)throw '+result+'.reason;');
    expect(setup).toContain('if(error instanceof CollegeServiceError&&error.code==="COLLEGE_NOT_FOUND")notFound();');
  });
  it("offers safe recovery from admin setup and content read failures", () => {
    expect(route("admin/tenants/setup/error.tsx")).toContain('href="/admin/tenants/directory"');
    expect(route("admin/videos/error.tsx")).toContain('href="/admin/lessons"');
    expect(route("admin/verification/page.tsx")).toContain('href="/admin/colleges"');
  });
  it("keeps the global verification entry college-scoped", () => {
    const verification = route("admin/verification/page.tsx");
    expect(verification).toContain("context.adminScope?.collegeId");
    expect(verification).toContain("if (collegeId)");
    expect(verification).toContain("AdminCollegeVerification");
    expect(verification).not.toContain("colleges[0]");
  });
});

describe("UX-G036 college placements page and drive guard", () => {
  it("verifies College Admin before any module-settings read", () => {
    const drives = route("college/placements/drives/page.tsx");
    const role = drives.indexOf('if (!hasMembershipRole(context, "COLLEGE_ADMIN")) redirect("/dashboard");');
    const moduleAccess = drives.indexOf('const moduleAccess = await resolveOptionalModuleAccess(context)');
    expect(role).toBeGreaterThan(0);
    expect(moduleAccess).toBeGreaterThan(role);
    expect(drives).toContain("if (error instanceof AuthorizationError) throw error;");
  });
  it("reports the actual all-drive total rather than only closed/draft", () => {
    const home = route("college/placements/page.tsx");
    expect(home).toContain('Browse all drives ({all?.total??"—"})');
    expect(home).not.toContain('draft&&closed?draft.total+closed.total:"—"} closed / draft');
  });
  it("provides a safe alternate path if a college drive read fails", () => {
    const fallback = route("college/placements/drives/error.tsx");
    expect(fallback).toContain('href="/college/placements"');
    expect(fallback).toContain("onClick={reset}");
    expect(fallback).not.toContain("error.message");
  });
  it("keeps calendar and interview routes bound to College Admin memberships", () => {
    expect(route("college/placements/calendar/page.tsx")).toContain("hasMembershipRole");
    expect(route("college/placements/interviews/page.tsx")).toContain('hasMembershipRole(context,"COLLEGE_ADMIN")');
  });
});

describe("UX-G044 legacy College Admin pages and error recovery", () => {
  it("continues role-checked redirects without reading a different tenant", () => {
    for (const name of ["departments", "programs"]) {
      const page = route("college-admin/" + name + "/page.tsx");
      expect(page).toContain("getCurrentRequestContext()");
      expect(page).toContain('"COLLEGE_ADMIN"');
    }
  });
  it("offers canonical route recovery alongside retry", () => {
    expect(route("college-admin/departments/error.tsx")).toContain('href="/college/departments"');
    expect(route("college-admin/programs/error.tsx")).toContain('href="/college/programs"');
    for (const name of ["departments", "programs"]) {
      const error = route("college-admin/" + name + "/error.tsx");
      expect(error).toContain("onClick={reset}");
      expect(error).toContain('min-h-11');
    }
  });
});

describe("UX-G087 Super Admin legacy page recovery", () => {
  it("preserves bounded query state through current-role checks", () => {
    for (const name of ["departments", "programs"]) {
      const page = route("superadmin/" + name + "/page.tsx");
      expect(page).toContain('legacyAdminBookmarkHref');
      expect(page).toContain('"SUPER_ADMIN"');
    }
    const crosswalk = route("superadmin/[...legacy]/page.tsx");
    expect(crosswalk).toContain("requirePermission(context,");
    expect(crosswalk).toContain("getProjectAdminCollegeId(context)");
  });
  it("labels the root handoff with its actual destination", () => {
    expect(route("superadmin/loading.tsx")).toContain("Opening Super Admin dashboard");
  });
  it("links unresolved old bookmarks to an existing role-safe dashboard", () => {
    expect(route("superadmin/not-found.tsx")).toContain('href="/dashboard"');
    expect(route("superadmin/[...legacy]/error.tsx")).toContain('homeHref="/dashboard"');
    expect(route("superadmin/error.tsx")).toContain('homeHref="/dashboard"');
  });
});

describe("UX-G097 Faculty result and follow-up filters", () => {
  it("makes invalid quiz query state explicitly recoverable", () => {
    const attempts = route("teacher/report/quiz/[quizId]/attempts/page.tsx");
    expect(attempts).toContain('ErrorState title="Invalid quiz attempt filters"');
    expect(attempts).toContain('No learner attempt details were loaded');
    expect(attempts).toContain('role="search" aria-label="Find learner quiz attempts"');
    expect(attempts).toContain("Reset all attempt filters");
    expect(attempts).toContain("Clear search");
    expect(attempts).toContain("Results are private to authorized Faculty");
  });
  it("uses accessible filter forms and live result summaries", () => {
    const followups = route("teacher/response-followups/page.tsx");
    const results = route("teacher/results/page.tsx");
    expect(followups).toContain('role="search" aria-label="Filter Faculty response follow-ups"');
    expect(followups).toContain('role="status" aria-live="polite"');
    expect(results).toContain('role="search" aria-label="Filter assessment results"');
    expect(results).toContain("Clear all filters");
    expect(results).toContain("No recorded response");
  });
});
