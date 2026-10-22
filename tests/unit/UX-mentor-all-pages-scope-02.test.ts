import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

/** Every active mentor route must use a scoped server service and preserve its
 * distinct empty/recovery/workspace state. A page filename alone is not proof. */
const pages=[
  {
    "route": "/mentor",
    "file": "src/app/(authenticated)/mentor/page.tsx",
    "service": "resolveOptionalModuleAccess",
    "state": "Could not verify Projects access"
  },
  {
    "route": "/mentor/activity",
    "file": "src/app/(authenticated)/mentor/activity/page.tsx",
    "service": "getMentorPortfolioActivity",
    "state": "No recorded activity"
  },
  {
    "route": "/mentor/calendar",
    "file": "src/app/(authenticated)/mentor/calendar/page.tsx",
    "service": "listMyMentorCalendarMeetings",
    "state": "MentorMeetingsCalendar"
  },
  {
    "route": "/mentor/notifications",
    "file": "src/app/(authenticated)/mentor/notifications/page.tsx",
    "service": "getMentorPersonalInbox",
    "state": "Notifications"
  },
  {
    "route": "/mentor/projects",
    "file": "src/app/(authenticated)/mentor/projects/page.tsx",
    "service": "listMyProjectInstances",
    "state": "ProjectParticipantPagination"
  },
  {
    "route": "/mentor/projects/[projectId]",
    "file": "src/app/(authenticated)/mentor/projects/[projectId]/page.tsx",
    "service": "requireProjectReadAccess",
    "state": "MentorProjectTabs"
  },
  {
    "route": "/mentor/projects/[projectId]/activity-history",
    "file": "src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx",
    "service": "getMentorProjectActivityHistory",
    "state": "No recorded project activity"
  },
  {
    "route": "/mentor/projects/[projectId]/board-review",
    "file": "src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx",
    "service": "getMentorBoardReview",
    "state": "No registered project tasks"
  },
  {
    "route": "/mentor/projects/[projectId]/closeout",
    "file": "src/app/(authenticated)/mentor/projects/[projectId]/closeout/page.tsx",
    "service": "getMentorProjectCloseout",
    "state": "MentorProjectCloseoutControl"
  },
  {
    "route": "/mentor/projects/[projectId]/deliveries/[submissionId]/review",
    "file": "src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx",
    "service": "getMentorDeliveryVersion",
    "state": "Delivery version "
  },
  {
    "route": "/mentor/projects/[projectId]/meetings/[meetingId]/notes",
    "file": "src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/page.tsx",
    "service": "getMentorMeetingNotes",
    "state": "MentorMeetingNotesEditor"
  },
  {
    "route": "/mentor/projects/[projectId]/resources-directory",
    "file": "src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx",
    "service": "getMentorResourceDirectory",
    "state": "No matching resources"
  },
  {
    "route": "/mentor/projects/[projectId]/review-completeness",
    "file": "src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/page.tsx",
    "service": "getMentorProjectReviewCompleteness",
    "state": "No registered delivery versions"
  },
  {
    "route": "/mentor/projects/[projectId]/review-overview",
    "file": "src/app/(authenticated)/mentor/projects/[projectId]/review-overview/page.tsx",
    "service": "getMentorDeliveryReviewOverview",
    "state": "No registered final delivery"
  },
  {
    "route": "/mentor/projects/[projectId]/risk-readiness",
    "file": "src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx",
    "service": "getMentorRiskReadiness",
    "state": "No recorded items for this filter"
  },
  {
    "route": "/mentor/projects/[projectId]/tasks/[taskId]/feedback",
    "file": "src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/page.tsx",
    "service": "getMentorTaskFeedback",
    "state": "No recorded reviewer feedback"
  },
  {
    "route": "/mentor/projects/[projectId]/team-history",
    "file": "src/app/(authenticated)/mentor/projects/[projectId]/team-history/page.tsx",
    "service": "getMentorTeamHistory",
    "state": "No team membership records"
  },
  {
    "route": "/mentor/projects/[projectId]/team-meetings",
    "file": "src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page.tsx",
    "service": "getMentorTeamMeetings",
    "state": "No recorded meetings"
  },
  {
    "route": "/mentor/projects/[projectId]/timeline",
    "file": "src/app/(authenticated)/mentor/projects/[projectId]/timeline/page.tsx",
    "service": "getMentorProjectTimeline",
    "state": "No matching registered releases"
  },
  {
    "route": "/mentor/reports",
    "file": "src/app/(authenticated)/mentor/reports/page.tsx",
    "service": "getMentorReports",
    "state": "No assigned projects match"
  },
  {
    "route": "/mentor/review-history",
    "file": "src/app/(authenticated)/mentor/review-history/page.tsx",
    "service": "getMentorReviewHistory",
    "state": "No recorded delivery reviews"
  },
  {
    "route": "/mentor/reviews",
    "file": "src/app/(authenticated)/mentor/reviews/page.tsx",
    "service": "getMentorReviewQueue",
    "state": "No deliveries awaiting review"
  },
  {
    "route": "/mentor/sprint-progress",
    "file": "src/app/(authenticated)/mentor/sprint-progress/page.tsx",
    "service": "getMentorSprintProgress",
    "state": "No persisted sprint progress"
  },
  {
    "route": "/mentor/task-review-history",
    "file": "src/app/(authenticated)/mentor/task-review-history/page.tsx",
    "service": "getMentorTaskReviewHistory",
    "state": "No reviewed task submissions"
  },
  {
    "route": "/mentor/task-reviews",
    "file": "src/app/(authenticated)/mentor/task-reviews/page.tsx",
    "service": "getMentorTaskReviews",
    "state": "No pending task reviews"
  },
  {
    "route": "/mentor/team-coverage",
    "file": "src/app/(authenticated)/mentor/team-coverage/page.tsx",
    "service": "getMentorTeamCoverage",
    "state": "No currently assigned active projects"
  }
] as const;

describe("UX-mentor-all-pages-scope-02 mentor page-state and scope coverage",()=>{
  for(const page of pages){
    it(`loads ${page.route} via its scoped service and preserves its distinct UI state`,()=>{
      const src=readFileSync(page.file,"utf8");
      expect(src).toContain("getCurrentRequestContext");
      expect(src).toContain(page.service);
      expect(src).toContain(page.state);
      if(page.route==="/mentor"){
        expect(src).toContain("<h1");
        expect(src).toContain("Retry access check");
        expect(src).toContain('hasMembershipRole(context,"MENTOR")');
        // The mentor landing is a semantic, accessible route-level fallback
        // and uses a Next Link rather than importing a shared page control.
        expect(src).toContain('import Link from "next/link"');
        expect(src).toContain("focus-visible:outline-2");
      }else {
        expect(src).toContain("PageHeader");
        expect(src).toMatch(/@\/components\/(?:ui|projects|activity)/);
      }
      expect(src).not.toContain("dangerouslySetInnerHTML");
    });
  }
  it("does not let callers pick a cross-tenant project in the mentor portfolio",()=>{
    const src=readFileSync("src/app/(authenticated)/mentor/projects/page.tsx","utf8");
    expect(src).toContain("mentorProjectListQuerySchema.safeParse");
    expect(src).toContain("hasMembershipRole");
    expect(src).toContain('"MENTOR"');
    expect(src).toContain('redirect("/dashboard")');
  });
  it("requires per-project authorization before showing the multi-tab workspace",()=>{
    const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx","utf8");
    expect(src).toContain("requireProjectReadAccess");
    expect(src).toContain("getCurrentRequestContext");
    expect(src).toContain("MentorProjectTabs");
  });
  it("keeps the other mentor portfolio tabs behind a role guard or scoped service",()=>{
    const scope=readFileSync("src/modules/projects/access.ts","utf8");
    expect(scope).toContain("context.user.platformStatus !== \"ACTIVE\"");
    expect(scope).toContain("membership.collegeId !== scope.collegeId");
    expect(scope).toContain("isNull(projectMembers.endedAt)");
    expect(scope).toContain("membership.roles.includes(");
    expect(scope).toContain("mayMutateProjectWithRole");
    expect(scope).toContain("requireProjectLifecycleAccess");
  });
});
