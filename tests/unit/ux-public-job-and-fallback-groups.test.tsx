import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { PublicExternalJobDetails } from "@/components/placements/public-external-job-details";
import RootLoading from "@/app/loading";

const src = (path: string) => readFileSync(path, "utf8");

describe("UX-G058/G187/G188 public jobs and recovery", () => {
  it("renders the employer handoff in a separate tab without submitting an LMS application", () => {
    const html = renderToStaticMarkup(<PublicExternalJobDetails job={{
      title: "Junior Data Analyst",
      companyName: "Example Employer",
      workMode: "ON_SITE",
      description: "Analyze data.\nCreate reports.",
      applyHref: "https://careers.example.test/apply",
    }} />);
    expect(html).toContain("Junior Data Analyst");
    expect(html).toContain("Example Employer");
    expect(html).toContain("ON SITE");
    expect(html).toContain("Analyze data.");
    expect(html).toContain('href="https://careers.example.test/apply"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("does not receive or confirm your application");
    expect(html).toContain("opens in a new tab");
    expect(html).toContain("About this role");
  });

  it("keeps the authoritative public-job visibility, revocation and URL guards in the server route", () => {
    const route = src("src/app/jobs/external/[slug]/page.tsx");
    const service = src("src/modules/placements/public-external-job-service.ts");
    expect(route).toContain("readPublicExternalJob(slug)");
    expect(route).toContain("if(!job)notFound()");
    expect(route).toContain("runAsSystem");
    expect(service).toContain('eq(placementJobs.status,"PUBLISHED")');
    expect(service).toContain("isNull(placementPublicExternalJobLinks.revokedAt)");
    expect(service).toContain('parsed.protocol!=="https:"');
    expect(service).toContain("eq(placementJobs.publicExternalSlug,slug.data)");
    expect(src("src/app/jobs/external/[slug]/error.tsx")).toContain('homeHref="/home"');
    expect(src("src/app/jobs/external/[slug]/loading.tsx")).toContain("Loading employer opportunity...");
  });

  it("root loading is role-neutral and retains accessible time-bounded recovery", () => {
    const html = renderToStaticMarkup(<RootLoading />);
    expect(html).toContain("Loading 42 LMS...");
    expect(html).toContain('role="status"');
    expect(html).toContain("42LMS home");
    expect(html).not.toContain("Loading sign in...");
  });

  it("404 stays non-indexed, role-aware, and supplies public account recovery only for anonymous visitors", () => {
    const source = src("src/app/not-found.tsx");
    expect(source).toContain("robots: { index: false, follow: false }");
    expect(source).toContain('let homeHref = "/dashboard"');
    expect(source).toContain("getShellNavigation(context)[0]?.href");
    expect(source).toContain("hasActiveRecruiter(context) || isSuperAdmin(context)");
    expect(source).toContain("context.membership");
    expect(source).toContain('alternateHref={showSignIn ? "/login" : undefined}');
    expect(source).toContain('homeHref={homeHref}');
    expect(source).not.toContain("redirect(");
  });

  it("test fixtures are inaccessible outside development", () => {
    for (const fixture of [
      "src/app/e2e/ux-g058-external-job/page.tsx",
      "src/app/e2e/ux-g187-loading/page.tsx",
    ]) {
      const source = src(fixture);
      expect(source).toContain('process.env.NODE_ENV !== "development"');
      expect(source).toContain("notFound()");
    }
  });
});
