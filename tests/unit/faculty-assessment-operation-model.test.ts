import {
  describe,
  expect,
  it,
} from "vitest";
import {
  assignmentSubmissionActions,
  quizReviewActions,
} from "@/components/courses/faculty-assessment-operation-model";

describe("Faculty Course assessment operation model", () => {
  it("allows grading at every submission state but publication only after grading", () => {
    expect(
      assignmentSubmissionActions({
        gradingStatus: "NOT_GRADED",
        gradePublished: false,
      }),
    ).toEqual({
      canGrade: true,
      canPublish: false,
      isPublished: false,
    });

    expect(
      assignmentSubmissionActions({
        gradingStatus: "GRADED",
        gradePublished: false,
      }),
    ).toEqual({
      canGrade: true,
      canPublish: true,
      isPublished: false,
    });

    expect(
      assignmentSubmissionActions({
        gradingStatus: "GRADED",
        gradePublished: true,
      }),
    ).toEqual({
      canGrade: true,
      canPublish: false,
      isPublished: true,
    });
  });

  it("keeps Quiz result publication exact-delivery owned and closed-only", () => {
    expect(
      quizReviewActions({
        deliveryOwned: true,
        status: "PUBLISHED",
        resultsPublished: false,
      }),
    ).toMatchObject({
      canReviewAttempts: true,
      canPublishResults: false,
      canHideResults: false,
    });

    expect(
      quizReviewActions({
        deliveryOwned: true,
        status: "CLOSED",
        resultsPublished: false,
      }),
    ).toMatchObject({
      canReviewAttempts: true,
      canPublishResults: true,
      canHideResults: false,
    });

    expect(
      quizReviewActions({
        deliveryOwned: true,
        status: "CLOSED",
        resultsPublished: true,
      }),
    ).toMatchObject({
      canPublishResults: false,
      canHideResults: true,
    });
  });

  it("lets Faculty review shared Quiz attempts without granting Offering-wide result control", () => {
    expect(
      quizReviewActions({
        deliveryOwned: false,
        status: "CLOSED",
        resultsPublished: false,
      }),
    ).toEqual({
      canReviewAttempts: true,
      canPublishResults: false,
      canHideResults: false,
    });
  });
});
