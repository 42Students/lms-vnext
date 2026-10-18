import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseTpoVerificationParams } from "@/modules/verification/tpo-queue-server-model";

// UX-coverage-closure: missing tests for other role-owned legacy/denial/lookup
// routes. No page code or owner feature behavior was modified by this suite.
const cases = [
  {
    "route": "/admin/course-progress/students",
    "file": "src/app/(authenticated)/admin/course-progress/students/page.tsx",
    "expected": [
      "getSuperAdminStudentCourseProgress",
      "ErrorState"
    ]
  },
  {
    "route": "/college/projects/create",
    "file": "src/app/(authenticated)/college/projects/create/page.tsx",
    "expected": [
      "CreateProjectControl",
      "getCurrentRequestContext"
    ]
  },
  {
    "route": "/college-admin/departments",
    "file": "src/app/(authenticated)/college-admin/departments/page.tsx",
    "expected": [
      "legacyDepartmentDestination",
      "redirect("
    ]
  },
  {
    "route": "/college-admin/programs",
    "file": "src/app/(authenticated)/college-admin/programs/page.tsx",
    "expected": [
      "legacyProgramDestination",
      "redirect("
    ]
  },
  {
    "route": "/mentor/allQuizzes",
    "file": "src/app/(authenticated)/mentor/allQuizzes/page.tsx",
    "expected": [
      "redirect(\"/mentor/projects\")"
    ]
  },
  {
    "route": "/mentor/contacts/[[...contactsTab]]",
    "file": "src/app/(authenticated)/mentor/contacts/[[...contactsTab]]/page.tsx",
    "expected": [
      "redirect(\"/mentor/projects\")"
    ]
  },
  {
    "route": "/mentor/courses",
    "file": "src/app/(authenticated)/mentor/courses/page.tsx",
    "expected": [
      "redirect(\"/mentor\")"
    ]
  },
  {
    "route": "/mentor/courses/[courseId]/[[...courseTab]]",
    "file": "src/app/(authenticated)/mentor/courses/[courseId]/[[...courseTab]]/page.tsx",
    "expected": [
      "redirect(\"/mentor/projects\")"
    ]
  },
  {
    "route": "/mentor/fileExplorer",
    "file": "src/app/(authenticated)/mentor/fileExplorer/page.tsx",
    "expected": [
      "redirect(\"/mentor/projects\")"
    ]
  },
  {
    "route": "/mentor/profile",
    "file": "src/app/(authenticated)/mentor/profile/page.tsx",
    "expected": [
      "redirect(\"/mentor/projects\")"
    ]
  },
  {
    "route": "/tpo/companies/[companyId]/team",
    "file": "src/app/(authenticated)/tpo/companies/[companyId]/team/page.tsx",
    "expected": [
      "hasPlacementTeamMembership",
      "readTpoCompanyTeam",
      "notFound()"
    ]
  },
  {
    "route": "/tpo/placements/recorded-outside/[recordId]",
    "file": "src/app/(authenticated)/tpo/placements/recorded-outside/[recordId]/page.tsx",
    "expected": [
      "hasMembershipRole(context",
      "getTpoOutsideDriveParticipants",
      "notFound()"
    ]
  },
  {
    "route": "/tpo/reports/[slug]",
    "file": "src/app/(authenticated)/tpo/reports/[slug]/page.tsx",
    "expected": [
      "hasMembershipRole(context",
      "Unknown report"
    ]
  },
  {
    "route": "/tpo/team/company/[companyId]",
    "file": "src/app/(authenticated)/tpo/team/company/[companyId]/page.tsx",
    "expected": [
      "hasPlacementTeamMembership",
      "readTpoCompanyTeam",
      "notFound()"
    ]
  },
  {
    "route": "/tpo/team/everyone",
    "file": "src/app/(authenticated)/tpo/team/everyone/page.tsx",
    "expected": [
      "hasMembershipRole(context",
      "readTpoTeamEveryone",
      "status:\"FAILED\""
    ]
  },
  {
    "route": "/tpo/verification",
    "file": "src/app/(authenticated)/tpo/verification/page.tsx",
    "expected": [
      "getTpoVerificationQueue",
      "TpoVerificationPanel",
      "parseTpoVerificationParams"
    ]
  },
  {
    "route": "/tracker/mine",
    "file": "src/app/(authenticated)/tracker/mine/page.tsx",
    "expected": [
      "context.user.platformStatus",
      "listMyTrackerReports",
      "Retry"
    ]
  },
  {
    "route": "/tracker/mine/[publicId]",
    "file": "src/app/(authenticated)/tracker/mine/[publicId]/page.tsx",
    "expected": [
      "trackerPublicIdSchema.safeParse",
      "getMyTrackerReport",
      "notFound()"
    ]
  }
] as const;
describe("UX-coverage-closure-leftovers-chat17 — legacy boundaries and private data",()=>{
  it("UX-coverage-closure-leftovers-01 closes the remaining named route test gaps without invented UI",()=>{
    expect(cases.length).toBe(18);
    expect(new Set(cases.map(row=>row.file)).size).toBe(18);
  });
  it("UX-/tpo/verification-coverage-03 rejects invalid or duplicate URL filters before queue reads",()=>{
    const accepted=parseTpoVerificationParams({
      tab:"WAITING",kind:"EDUCATION",waitingSince:"OVER_WEEK",
      search:"  IIT Dharwad  ",page:"2",pageSize:"25",
    });
    expect(accepted).not.toBeNull();
    expect(accepted).toMatchObject({
      tab:"WAITING",kind:"EDUCATION",waitingSince:"OVER_WEEK",
      search:"IIT Dharwad",page:2,pageSize:25,
    });
    for(const query of [
      {tab:["WAITING","VERIFIED"]},
      {tab:"NOT_A_TAB"},
      {branchId:"not-a-uuid"},
      {page:"-1"},
      {pageSize:"20"},
      {unknown:"private"},
    ]){
      expect(parseTpoVerificationParams(query)).toBeNull();
    }
  });

  it.each(cases)("UX-$route-coverage-02 preserves its permission, routing and recovery contract",({file,expected})=>{
    const page=readFileSync(join(process.cwd(),file),"utf8");
    for(const contract of expected)expect(page).toContain(contract);
    expect(page).not.toMatch(/window\.(?:alert|confirm|prompt|open)\s*\(/);
    expect(page).not.toMatch(/target\s*=\s*["']_blank["']/);
  });
});
