import { describe, expect, it } from "vitest";
import { learningPathTransitionSchema } from "@/modules/courses/validation";
import { canPublishPath, canUnpublishPath } from "@/modules/courses/college-learning-path-transition-policy";

describe("College offering path lifecycle policy", () => {
  it("requires at least one active lesson before publishing", () => {
    expect(canPublishPath(false)).toBe(false);
    expect(canPublishPath(true)).toBe(true);
  });
  it("denies unpublishing after any persisted learner engagement", () => {
    expect(canUnpublishPath({progressRows:0,submissionRows:0,attemptRows:0})).toBe(true);
    for(const key of ["progressRows","submissionRows","attemptRows"] as const) {
      expect(canUnpublishPath({progressRows:0,submissionRows:0,attemptRows:0,[key]:1})).toBe(false);
    }
  });
  it("strictly accepts PUBLISH/UNPUBLISH/ARCHIVE and rejects client scope", () => {
    expect(learningPathTransitionSchema.parse({action:"UNPUBLISH"})).toEqual({action:"UNPUBLISH"});
    expect(learningPathTransitionSchema.safeParse({action:"UNPUBLISH",collegeId:"foreign"}).success).toBe(false);
  });
});
