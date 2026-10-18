import {describe,expect,it} from "vitest";
import {learnerAssessmentMatchesState} from "@/modules/courses/learner-assessment-state-filter-model";
const now=Date.parse("2026-10-15T09:00:00Z");
const quiz={kind:"QUIZ" as const,attemptsUsed:0,attemptsRemaining:1,status:"PUBLISHED" as const,dueAt:"2026-10-15T09:30:00Z",resultsPublished:false};
const assignment={kind:"ASSIGNMENT" as const,submittedAt:null,gradePublished:false};
describe("learner assessment state filters",()=>{
  it("keeps late unsubmitted assignments actionable and closes expired quizzes",()=>{
    expect(learnerAssessmentMatchesState(assignment,"PENDING",now)).toBe(true);
    expect(learnerAssessmentMatchesState(quiz,"PENDING",now)).toBe(true);
    expect(learnerAssessmentMatchesState(quiz,"PENDING",Date.parse("2026-10-15T10:00:00Z"))).toBe(false);
    expect(learnerAssessmentMatchesState({...quiz,status:"CLOSED"},"PENDING",now)).toBe(false);
  });
  it("distinguishes submission from published feedback",()=>{
    expect(learnerAssessmentMatchesState({...assignment,submittedAt:"2026-10-15T09:00:00Z"},"COMPLETED",now)).toBe(true);
    expect(learnerAssessmentMatchesState({...assignment,submittedAt:"2026-10-15T09:00:00Z"},"RESULTS",now)).toBe(false);
    expect(learnerAssessmentMatchesState({...quiz,attemptsUsed:1},"RESULTS",now)).toBe(false);
    expect(learnerAssessmentMatchesState({...quiz,attemptsUsed:1,resultsPublished:true},"RESULTS",now)).toBe(false);
    // Result publication alone is insufficient while the attempt is still open.
    expect(learnerAssessmentMatchesState({...quiz,attemptsUsed:1,status:"CLOSED",resultsPublished:true},"RESULTS",now)).toBe(false);
    // Published feedback is visible only once the quiz is closed AND its deadline passed.
    expect(learnerAssessmentMatchesState({...quiz,attemptsUsed:1,status:"CLOSED",resultsPublished:true},"RESULTS",Date.parse("2026-10-15T10:00:00Z"))).toBe(true);
  });
});
