import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  projectRecruiterProfileLinks,
  safeRecruiterExternalLink,
} from "../../src/modules/placements/recruiter-applicant-shared-links-model";
import { buildHrApplicantDrawer } from "../../src/modules/placements/hr-applicant-drawer-model";
import { isRecruiterSharedCandidateAllowed } from "../../src/modules/placements/recruiter-shared-candidate-policy";

const sample = {
  id: "1c6b9491-7ff6-4602-8d2e-cbb0784b8202",
  name: "IIT Dharwad capstone",
  projectUrl: "https://example.org/project/alpha",
};
const profile = {
  projects: [sample],
  socialProfiles: { githubUrl: "https://github.com/student", portfolioUrl: "https://example.org" },
  skills: [{ id: sample.id, name: "TypeScript" }],
};
const allowed = {
  companyId: "employer",
  jobCompanyId: "employer",
  jobCollegeId: "college-A",
  membershipCollegeId: "college-A",
  applicationStatus: "SUBMITTED",
  screeningStatus: "SHORTLISTED",
  membershipStatus: "ACTIVE",
  userPlatformStatus: "ACTIVE",
};

describe("HR/Recruiter Projects role journey", () => {
  it("PROJ-HR-01 blocks project visibility until BOTH company and college policy allow sharing", () => {
    expect(projectRecruiterProfileLinks(profile, { projects: false, skills: false })).toEqual({
      githubUrl: null, portfolioUrl: null, skills: [], projects: [],
    });
    expect(projectRecruiterProfileLinks(profile, { projects: false, skills: true }).projects).toEqual([]);
    expect(projectRecruiterProfileLinks(profile, { projects: true, skills: false }).skills).toEqual([]);
    const visible = projectRecruiterProfileLinks(profile, { projects: true, skills: true });
    expect(visible.projects).toEqual([{ name: sample.name, url: sample.projectUrl }]);
    expect(visible.skills).toEqual(["TypeScript"]);
    const reader = readFileSync("src/modules/placements/hr-job-read-service.ts", "utf8");
    expect(reader).toContain('share?.columns?.includes("projects") && visibility?.projects');
    expect(reader).toContain("projectRecruiterProfileLinks(profileDocument");
  });

  it.each([
    "javascript:alert(1)", "data:text/html,hi", "http://example.org/project",
    "https://localhost/test", "https://localhost./test",
    "https://dev.local./internal", "https://127.0.0.1/test",
    "https://192.168.1.1/test", "https://10.0.0.12/test",
    "https://169.254.169.254/test", "https://user:pass@example.org",
    "not a url", "x".repeat(2200),
  ])("PROJ-HR-02 denies unsafe learner-controlled URLs: %s", url => {
    expect(safeRecruiterExternalLink(url)).toBeNull();
    const result = projectRecruiterProfileLinks({
      projects: [{ ...sample, projectUrl: url }],
    }, { projects: true, skills: false });
    expect(result.projects).toEqual([]);
  });

  it("PROJ-HR-03 denies wrong-tenant, wrong-employer, unshared and deactivated candidates", () => {
    expect(isRecruiterSharedCandidateAllowed(allowed)).toBe(true);
    const cases = [
      { companyId: "other" }, { companyId: null }, { jobCompanyId: "other" },
      { jobCollegeId: "college-B" }, { membershipCollegeId: "college-B" },
      { applicationStatus: "WITHDRAWN" }, { screeningStatus: "PENDING" },
      { membershipStatus: "INACTIVE" }, { userPlatformStatus: "SUSPENDED" },
    ];
    for (const changed of cases) {
      expect(isRecruiterSharedCandidateAllowed({ ...allowed, ...changed })).toBe(false);
    }
    const reader = readFileSync("src/modules/placements/hr-job-read-service.ts", "utf8");
    expect(reader).toContain("getRecruiterPlacementWorkspace(context, resolvedJobId)");
    expect(reader).toContain("eq(collegeMemberships.collegeId, workspace.college.id)");
    expect(reader).toContain('eq(placementApplicationScreenings.status, "SHORTLISTED")');
  });

  it("PROJ-HR-04 stale applicant deep links cannot reveal withdrawn screening or different applicant project details", () => {
    const applicant = {
      id: sample.id, name: "Shared learner", role: "Developer",
      email: null, submittedAt: new Date("2099-01-01T00:00:00.000Z"),
      screening: "SHORTLISTED", status: "SUBMITTED",
      sharedProjects: [{ name: sample.name, url: sample.projectUrl }],
    };
    expect(buildHrApplicantDrawer([applicant], "8abb049a-5d17-43d7-9a6b-1861deae7d3c")).toBeNull();
    expect(buildHrApplicantDrawer([{ ...applicant, screening: "REJECTED" }], applicant.id)).toBeNull();
    expect(buildHrApplicantDrawer([applicant], applicant.id)?.sharedProjects).toHaveLength(1);
    const page = readFileSync("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx", "utf8");
    expect(page).toContain("if (filters.applicant && !selectedApplicant) notFound()");
    expect(page).toContain("!hasActiveRecruiter(context) || context.recruiter?.userId !== context.user.id");
    expect(page).toContain("<ThirdPartyLink");
  });

  it("PROJ-HR-05 large or malformed profile data fails closed without leaking the raw document", () => {
    expect(projectRecruiterProfileLinks({ projects: "invalid" }, { projects: true, skills: true })).toEqual({
      githubUrl: null, portfolioUrl: null, skills: [], projects: [],
    });
    const large = {
      projects: Array.from({ length: 50 }, (_, i) => ({
        ...sample, id: sample.id, name: `Project ${i}`,
        projectUrl: `https://example.org/projects/${i}`,
      })),
    };
    expect(projectRecruiterProfileLinks(large, { projects: true, skills: false }).projects).toHaveLength(10);
  });
  it("PROJ-HR-07 a stale shortlist cannot retain project access after withdrawal", () => {
    const application = {
      id: sample.id, name: "Past shared learner", role: "Developer",
      email: "student@example.org",
      submittedAt: new Date("2026-01-01T00:00:00.000Z"),
      screening: "SHORTLISTED", status: "WITHDRAWN",
      resumeShared: true, phone: "+919999999999",
      sharedProjects: [{ name: sample.name, url: sample.projectUrl }],
    };
    expect(buildHrApplicantDrawer([application], application.id)).toBeNull();
    expect(buildHrApplicantDrawer([{ ...application, status: "SUBMITTED" }], application.id)?.sharedProjects).toHaveLength(1);
    const service = readFileSync("src/modules/placements/hr-job-read-service.ts", "utf8");
    expect(service).toContain('const active = row.status === "SUBMITTED"');
    expect(service).toContain("resumeShared:active && shareResume");
    expect(service).toContain("rollNumber:active && shareRoll?");
    expect(service).toContain("email:active && shareEmail?");
    expect(service).toContain("phone:active && sharePhone?");
    expect(service).toContain("branch:active && shareBranch");
    expect(service).toContain("ugPercentage:active && shareUg?");
    expect(service).toContain("githubUrl:links.githubUrl,portfolioUrl:links.portfolioUrl");
    expect(service).toContain("projects: [] as Array<{ name: string; url: string }>");
  });

  it("PROJ-HR-08 trailing-dot localhost and local network hostnames stay blocked", () => {
    for (const value of [
      "https://localhost./dashboard",
      "https://localhost.../dashboard",
      "https://campus.local./dashboard",
      "https://127.0.0.1./dashboard",
      "https://192.168.1.1./dashboard",
    ]) expect(safeRecruiterExternalLink(value)).toBeNull();
  });

});
