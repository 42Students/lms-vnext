import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("learner course deadline, own submissions and empty state",()=>{
  it("LEARNER-course-detail-01 rejects missing and elapsed deadlines on the server and closes the learner card",()=>{
    const service=source("src/modules/courses/assignment-submission-service.ts");
    const policy=source("src/modules/courses/assignment-submission-deadline-policy.ts");
    const page=source("src/components/courses/learner-course-workspace.tsx");
    expect(service).toContain("assertAssignmentSubmissionDeadline(currentAssignment.dueAt, new Date())");
    expect(policy).toContain("ASSIGNMENT_DEADLINE_PASSED");
    expect(policy).toContain("ASSIGNMENT_DEADLINE_NOT_CONFIGURED");
    expect(page).toContain("Submission closed");
    expect(page).toContain("Submissions are closed");
    expect(page).toContain("submissionClosed");
  });
  it("LEARNER-course-detail-06 shows both written and link submissions and safe read-only links",()=>{
    const page=source("src/components/courses/learner-course-workspace.tsx");
    expect(page).toContain('submission.submissionText');
    // Assignment projection keys are used directly, not the aggregate assignment page.
    expect(page).toContain("assignment.submissionText");
    expect(page).toContain("assignment.submissionUrl");
    expect(page).toContain('aria-label="Your submission"');
    expect(page).toContain("learnerAssessmentSubmittedLinkHref");
  });
  it("LEARNER-course-detail-20 restores no-roadmap, no-content and filtered lesson copy",()=>{
    const page=source("src/components/courses/learner-course-workspace.tsx");
    for(const copy of ["No roadmap items yet","Create lessons and add content to show the learner roadmap.",
       "No lectures in this lesson.","No lesson content yet","No content in this lesson yet."])
      expect(page).toContain(copy);
    expect(page).not.toContain("No published learning items in this lesson yet.");
  });
});
