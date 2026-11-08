import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { learnerAssignmentListPage,learnerAssignmentListHref,
  learnerAssignmentListRecoveryPage } from "@/modules/courses/learner-assignment-page-model";
import AssignmentError from "@/app/(authenticated)/learn/allAssignments/error";
import QuizError from "@/app/(authenticated)/learn/allQuizzes/error";
import AssignmentDetailError from "@/app/(authenticated)/learn/allAssignments/[assignmentId]/error";
import QuizDetailError from "@/app/(authenticated)/learn/allQuizzes/[quizId]/error";
import AssignmentLoading from "@/app/(authenticated)/learn/allAssignments/loading";
import QuizLoading from "@/app/(authenticated)/learn/allQuizzes/loading";
import AssignmentDetailLoading from "@/app/(authenticated)/learn/allAssignments/[assignmentId]/loading";
import QuizDetailLoading from "@/app/(authenticated)/learn/allQuizzes/[quizId]/loading";

describe("UX-G059 learner assessment route safety and recovery",()=>{
  it("recovers stale pages based only on the scoped results count",()=>{
    expect(learnerAssignmentListRecoveryPage(7,25)).toBe(2);
    expect(learnerAssignmentListRecoveryPage(1,0)).toBeNull();
    expect(learnerAssignmentListRecoveryPage(4,0)).toBe(1);
    expect(learnerAssignmentListRecoveryPage(2,40)).toBeNull();
    expect(learnerAssignmentListRecoveryPage(3,41)).toBeNull();
    expect(learnerAssignmentListRecoveryPage(2,-1)).toBeNull();
    expect(learnerAssignmentListRecoveryPage(2,Number.POSITIVE_INFINITY)).toBeNull();
    expect(learnerAssignmentListRecoveryPage(2,5,0)).toBeNull();
  });
  it("preserves an authorized course while dropping an out-of-range page",()=>{
    const course="123e4567-e89b-42d3-a456-426614174000";
    expect(learnerAssignmentListHref(1,course))
      .toBe("/learn/allAssignments?course="+course);
    expect(learnerAssignmentListHref(2,course))
      .toBe("/learn/allAssignments?course="+course+"&page=2");
    expect(learnerAssignmentListPage(["2"])).toBeNull();
    expect(learnerAssignmentListPage("0002")).toBeNull();
  });
  it("renders meaningful error recovery with role-specific safe exits",()=>{
    const error=new Error("PRIVATE_ERROR_DO_NOT_DISPLAY");
    for(const [Component,href] of [
      [AssignmentError,"/learn/courses"],
      [QuizError,"/learn/courses"],
      [AssignmentDetailError,"/learn/allAssignments"],
      [QuizDetailError,"/learn/allQuizzes"],
    ] as const){
      const html=renderToStaticMarkup(<Component error={error} reset={()=>{}} />);
      expect(html).toContain('href="'+href+'"');
      expect(html).toMatch(/Retry|Try again/);
      expect(html).not.toContain("PRIVATE_ERROR_DO_NOT_DISPLAY");
    }
  });
  it("gives each real list and detail loading route a single polite status",()=>{
    for(const Component of [AssignmentLoading,QuizLoading,AssignmentDetailLoading,QuizDetailLoading]){
      const html=renderToStaticMarkup(<Component />);
      expect((html.match(/role="status"/g)||[])).toHaveLength(1);
      expect(html).toContain('aria-busy="true"');
    }
  });
});
