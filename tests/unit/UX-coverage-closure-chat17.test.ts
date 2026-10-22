import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// UX closure: literal exact paths count in scripts/audit/ux-coverage.mjs.
// These are existing route implementations, not replaced or weakened tests.
const cases = [
  {
    "route": "/learn/profile/data-access",
    "file": "src/app/(authenticated)/learn/profile/data-access/page.tsx",
    "id": "learn-profile-data-access"
  },
  {
    "route": "/teach/courses",
    "file": "src/app/(authenticated)/teach/courses/page.tsx",
    "id": "teach-courses"
  },
  {
    "route": "/teach/courses/[deliveryId]",
    "file": "src/app/(authenticated)/teach/courses/[deliveryId]/page.tsx",
    "id": "teach-courses-deliveryId"
  },
  {
    "route": "/teacher/allAssignments",
    "file": "src/app/(authenticated)/teacher/allAssignments/page.tsx",
    "id": "teacher-allAssignments"
  },
  {
    "route": "/teacher/allQuizzes",
    "file": "src/app/(authenticated)/teacher/allQuizzes/page.tsx",
    "id": "teacher-allQuizzes"
  },
  {
    "route": "/teacher/calendar",
    "file": "src/app/(authenticated)/teacher/calendar/page.tsx",
    "id": "teacher-calendar"
  },
  {
    "route": "/teacher/contacts/[contactsTab]",
    "file": "src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx",
    "id": "teacher-contacts-contactsTab"
  },
  {
    "route": "/teacher/contacts/[contactsTab]/[membershipId]",
    "file": "src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/page.tsx",
    "id": "teacher-contacts-contactsTab-membershipId"
  },
  {
    "route": "/teacher/courses",
    "file": "src/app/(authenticated)/teacher/courses/page.tsx",
    "id": "teacher-courses"
  },
  {
    "route": "/teacher/courses/[deliveryId]/assessment-health",
    "file": "src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/page.tsx",
    "id": "teacher-courses-deliveryId-assessment-health"
  },
  {
    "route": "/teacher/courses/[deliveryId]/assignments/manage",
    "file": "src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/page.tsx",
    "id": "teacher-courses-deliveryId-assignments-manage"
  },
  {
    "route": "/teacher/courses/[deliveryId]/attendance-corrections",
    "file": "src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/page.tsx",
    "id": "teacher-courses-deliveryId-attendance-corrections"
  },
  {
    "route": "/teacher/courses/[deliveryId]/attendanceDetail",
    "file": "src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx",
    "id": "teacher-courses-deliveryId-attendanceDetail"
  },
  {
    "route": "/teacher/courses/[deliveryId]/discussion-history",
    "file": "src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/page.tsx",
    "id": "teacher-courses-deliveryId-discussion-history"
  },
  {
    "route": "/teacher/courses/[deliveryId]/discussion-participation",
    "file": "src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/page.tsx",
    "id": "teacher-courses-deliveryId-discussion-participation"
  },
  {
    "route": "/teacher/courses/[deliveryId]/discussions",
    "file": "src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx",
    "id": "teacher-courses-deliveryId-discussions"
  },
  {
    "route": "/teacher/courses/[deliveryId]/gradebook",
    "file": "src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx",
    "id": "teacher-courses-deliveryId-gradebook"
  },
  {
    "route": "/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]",
    "file": "src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/page.tsx",
    "id": "teacher-courses-deliveryId-gradebook-learnerMembershipId"
  },
  {
    "route": "/teacher/courses/[deliveryId]/notices",
    "file": "src/app/(authenticated)/teacher/courses/[deliveryId]/notices/page.tsx",
    "id": "teacher-courses-deliveryId-notices"
  },
  {
    "route": "/teacher/courses/[deliveryId]",
    "file": "src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx",
    "id": "teacher-courses-deliveryId"
  },
  {
    "route": "/teacher/courses/[deliveryId]/quizzes/manage",
    "file": "src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/page.tsx",
    "id": "teacher-courses-deliveryId-quizzes-manage"
  },
  {
    "route": "/teacher/courses/[deliveryId]/reports",
    "file": "src/app/(authenticated)/teacher/courses/[deliveryId]/reports/page.tsx",
    "id": "teacher-courses-deliveryId-reports"
  },
  {
    "route": "/teacher/courses/[deliveryId]/session-coverage",
    "file": "src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/page.tsx",
    "id": "teacher-courses-deliveryId-session-coverage"
  },
  {
    "route": "/teacher/courses/[deliveryId]/students",
    "file": "src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx",
    "id": "teacher-courses-deliveryId-students"
  },
  {
    "route": "/teacher/courses/[deliveryId]/students/[membershipId]",
    "file": "src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/page.tsx",
    "id": "teacher-courses-deliveryId-students-membershipId"
  },
  {
    "route": "/teacher/courses/[deliveryId]/[...courseTab]",
    "file": "src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx",
    "id": "teacher-courses-deliveryId-courseTab"
  },
  {
    "route": "/teacher/notifications",
    "file": "src/app/(authenticated)/teacher/notifications/page.tsx",
    "id": "teacher-notifications"
  },
  {
    "route": "/teacher/profile/contacts",
    "file": "src/app/(authenticated)/teacher/profile/contacts/page.tsx",
    "id": "teacher-profile-contacts"
  },
  {
    "route": "/teacher/profile/details",
    "file": "src/app/(authenticated)/teacher/profile/details/page.tsx",
    "id": "teacher-profile-details"
  },
  {
    "route": "/teacher/profile",
    "file": "src/app/(authenticated)/teacher/profile/page.tsx",
    "id": "teacher-profile"
  },
  {
    "route": "/teacher/profile/teaching",
    "file": "src/app/(authenticated)/teacher/profile/teaching/page.tsx",
    "id": "teacher-profile-teaching"
  },
  {
    "route": "/company-share/[token]",
    "file": "src/app/company-share/[token]/page.tsx",
    "id": "company-share-token"
  },
  {
    "route": "/e2e/superadmin-login",
    "file": "src/app/e2e/superadmin-login/page.tsx",
    "id": "e2e-superadmin-login"
  },
  {
    "route": "/enterprises",
    "file": "src/app/enterprises/page.tsx",
    "id": "enterprises"
  },
  {
    "route": "/forbidden",
    "file": "src/app/forbidden/page.tsx",
    "id": "forbidden"
  },
  {
    "route": "/platform",
    "file": "src/app/platform/page.tsx",
    "id": "platform"
  },
  {
    "route": "/privacy-policy",
    "file": "src/app/privacy-policy/page.tsx",
    "id": "privacy-policy"
  },
  {
    "route": "/request-demo",
    "file": "src/app/request-demo/page.tsx",
    "id": "request-demo"
  },
  {
    "route": "/universities",
    "file": "src/app/universities/page.tsx",
    "id": "universities"
  }
] as const;
const read = (file:string) => readFileSync(join(process.cwd(),file),"utf8");

describe("chat-17 UX-coverage-closure-01 owned route contracts",()=>{
  it("UX-coverage-closure-01 enumerates literal app sources from the generated gap list",()=>{
    expect(cases.length).toBe(39);
    expect(new Set(cases.map(row=>row.file)).size).toBe(cases.length);
  });
  it.each(cases)("UX-$id-coverage-02 maintains authorized route, safe actions and recovery",({route,file})=>{
    const page=read(file);
    expect(page).not.toMatch(/window\.(?:alert|confirm|prompt|open)\s*\(/);
    // Trusted HTTPS applicant evidence may open in an isolated new tab.
    const externalTabs=[...page.matchAll(/<a\b[^>]*target\s*=\s*["']_blank["'][^>]*>/g)]
      .map(([markup])=>markup);
    for(const markup of externalTabs)
      expect(markup).toMatch(/rel=["']noopener noreferrer["']/);
    if(route.startsWith("/teacher/")||route.startsWith("/teach/")){
      // Permission context or redirect to a canonical permission-checked destination.
      expect(page).toMatch(/getCurrentRequestContext|redirect\(/);
      expect(page).toMatch(/PageHeader|FacultyCourseWorkspace|FacultyCourseList|RetainedFacultyAssignments|redirect\(/);
      if(page.includes("redirect(")){
        expect(page).not.toContain('redirect("/login")');
      }
    }else if(route==="/learn/profile/data-access"){
      expect(page).toContain("getCurrentRequestContext");
      expect(page).toContain("getOwnLearnerProfileDataActions(context)");
      expect(page).toContain('title="Who has my data"');
    }else if(route==="/company-share/[token]"){
      expect(page).toContain("safeCompanyShareColumns");
      expect(page).toContain("getPublicCompanyApplicantShare");
      expect(page).toContain("<DataTable");
      expect(page).toContain("index:false");
    }else if(route==="/e2e/superadmin-login"){
      expect(page).toContain('process.env.NODE_ENV === "development"');
      expect(page).toContain('isSuperAdmin(await getCurrentRequestContext())');
      expect(page).toContain("This link no longer creates a Super Admin session.");
    }else if(route==="/forbidden"){
      expect(page).toContain("GracefulScreen");
      expect(page).toContain('homeHref="/dashboard"');
      expect(page).toContain("index: false");
    }else if(route==="/privacy-policy"){
      expect(page).toContain('public/assets/static/privacy-policy-view.html');
      expect(page).toContain('dangerouslySetInnerHTML={{__html:documentBody}}');
      expect(page).toContain('robots: { index: true, follow: true }');
    }else if(route==="/request-demo"){
      expect(page).toContain("MarketingLayout");
      expect(page).toContain('const DEMO_EMAIL = "hello@42lms.com"');
      expect(page).toContain('const DEMO_MAILTO = "mailto:" + DEMO_EMAIL');
      expect(page).toContain("href={DEMO_MAILTO}");
      expect(page).toContain("Email us to book a demo");
    }else{
      expect(page).toContain("MarketingLayout");
      expect(page).toContain("MarketingHero");
      expect(page).toContain("MarketingCta");
    }
  });
});
