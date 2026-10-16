import { describe, expect, it } from "vitest";
import { getShellNavigation } from "@/components/shell/shell-model";
import type { RequestContext } from "@/modules/identity/context";

const tpo: RequestContext = {
  user: { id: "u", identityUid: "identity", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: "m", organizationId: "o", collegeId: "c", status: "ACTIVE", roles: ["TPO"] },
};
const recruiter: RequestContext = {
  ...tpo, membership: null,
  recruiter: {
    userId: "u", companyId: "company", companyName: "Employer",
    title: "Recruiter", status: "ACTIVE",
    grants: [{ id: "g", organizationId: "o", collegeId: "c",
      collegeName: "College", companyRelationshipId: "company-r" }],
  },
};

describe("Phase 2 legacy exact sidebar contract (legacy-copy-B.md)", () => {
  it("TPO labels and visible groups match all 15 old LMS rows in order", () => {
    const items = getShellNavigation(tpo);
    expect(items.map(item => item.label)).toEqual([
      "Home", "Placement eligibility", "Engage", "Drives", "Team",
      "Students", "Requests", "Verification", "Calendar", "Announcements",
      "Reports", "Messages", "Settings", "Audit log", "Notifications",
    ]);
    expect(items.map(item => item.group)).toEqual([
      ...Array(5).fill("operate"), ...Array(5).fill("coordinate"),
      "insights", ...Array(4).fill("administration"),
    ]);
    expect(items.map(item => item.href)).toEqual([
      "/tpo/home", "/tpo/batches", "/tpo/recruiters", "/tpo/placements",
      "/tpo/team", "/tpo/students", "/tpo/requests", "/tpo/verification",
      "/tpo/calendar", "/tpo/announcements", "/tpo/reports",
      "/tpo/messages", "/tpo/settings", "/tpo/audit", "/tpo/notifications",
    ]);
  });

  it("recruiter labels match all five old LMS rows without added Profile or Dashboard", () => {
    const items = getShellNavigation(recruiter);
    expect(items.map(item => item.label)).toEqual([
      "Today", "Drives", "Calendar", "Messages", "Company & Team",
    ]);
    expect(items.map(item => item.href)).toEqual([
      "/hr/home", "/hr/drives", "/hr/calendar", "/hr/conversations", "/hr/company",
    ]);
    expect(items.some(item => item.label === "Dashboard" || item.label === "More" || item.label === "Companies")).toBe(false);
  });
});
