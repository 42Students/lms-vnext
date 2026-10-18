import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const load = (path: string) => readFileSync(path, "utf8");
const root = "src/app/(authenticated)/hr/";
const routeNames = [
  "activity", "calendar", "company", "company/reports",
  "conversations", "conversations/[threadId]", "drives",
  "drives/[jobId]/interview-slots", "drives/[jobId]/messages",
  "drives/[jobId]/rounds/editor", "drives/[jobId]/rounds/editor/remove/[roundId]",
  "drives/new", "drives/proposals", "drives/recorded-outside",
  "home", "notifications", "placements", "placements/jobs/[jobId]",
  "profile", "round-results",
] as const;
const slugs = routeNames.map(name => name.replaceAll("/", "-")
  .replaceAll("[", "").replaceAll("]", ""));

describe("HR page-level access, recovery and mobile contracts", () => {
  it.each(routeNames.map((route, index) => [route, slugs[index]] as const))(
    "UX-hr-%s-02 never renders employer data before an active recruiter context is established",
    (route) => {
      const source = load(root + route + "/page.tsx");
      expect(source).toContain("getCurrentRequestContext");
      expect(source).toMatch(/hasActiveRecruiter\(context\)/);
      expect(source).toMatch(/redirect\(/);
    },
  );

  it("UX-hr-colleges-02 retired route redirects instead of exposing the old college directory", () => {
    expect(load(root + "colleges/page.tsx")).toContain('redirect("/hr/home")');
  });

  it("UX-hr-messages-02 alias uses the same scoped conversation inbox", () => {
    expect(load(root + "messages/page.tsx"))
      .toMatch(/export \{default\} from .*hr\/conversations\/page/);
  });

  it("UX-hr-pages-03 a slow or failed network cannot leave every HR page on an unbounded skeleton", () => {
    const loading = load(root + "loading.tsx");
    const error = load(root + "error.tsx");
    const helper = load("src/components/ui/graceful-page-loading.tsx");
    expect(loading).toContain("<GracefulPageLoading");
    expect(error).toContain("<GracefulErrorBoundary");
    expect(helper).toContain("setSlow(true)");
    expect(helper).toContain('role="status"');
    expect(helper).toContain('onClick={() => window.location.reload()}');
    expect(error).not.toContain("{error.message}");
  });

  it("HR-XA-01 offers and selection history keep all fields accessible without side scrolling on a phone", () => {
    const source = load(root + "placements/jobs/[jobId]/page.tsx");
    expect(source).toContain('caption="Placement-cell selection history"');
    expect(source).toContain('caption="Offers for shared applicants at this college"');
    expect(source).toContain('mobilePriority: "primary"');
    expect(source).toContain('mobilePriority: "secondary"');
    for (const column of ["Candidate", "Role", "CTC (LPA)", "Status", "Reply by", "Joining"]) {
      expect(source).toContain(`header: "${column}"`);
    }
    expect(source).not.toContain("<table");
    const table = load("src/components/ui/data-table.tsx");
    expect(table).toContain("const extra=");
    expect(table).toContain("<Disclosure");
    expect(table).toContain('sm:hidden');
  });

  it("HR-XA-02 HR-XA-03 HR-XA-04 show recovery and readable back navigation after load failures", () => {
    const drivesLoading = load(root + "drives/loading.tsx");
    const jobLoading = load(root + "placements/jobs/[jobId]/loading.tsx");
    const drivesError = load(root + "drives/error.tsx");
    const jobError = load(root + "placements/jobs/[jobId]/error.tsx");
    expect(drivesLoading).toContain('<GracefulPageLoading label="Loading hiring drives"');
    expect(jobLoading).toContain('<GracefulPageLoading label="Loading hiring job"');
    expect(drivesError).toContain('<Button type="button" onClick={reset}>Try again</Button>');
    expect(jobError).toContain("No applicant or offer details are");
    expect(jobError).toContain("text-[var(--lms-teal-deep)]");
    expect(jobError).toContain("focus-visible:outline-2");
    expect(jobError).not.toContain("text-primary-text");
  });

  it("UX-hr-job-details-02 invalid and withdrawn applicant deep links fail closed", () => {
    const source = load(root + "placements/jobs/[jobId]/page.tsx");
    expect(source).toContain("getHrJobRead(context, jobId");
    expect(source).toContain("if (filters.applicant && !selectedApplicant) notFound()");
    expect(source).toContain("if (focused && selectedId && !focusedIds.includes(selectedId)) notFound()");
    const service = load("src/modules/placements/hr-job-read-service.ts");
    expect(service).toContain("getRecruiterPlacementWorkspace(context, rawJobId)");
    expect(service).toContain("eq(collegeMemberships.collegeId, workspace.college.id)");
  });
});
