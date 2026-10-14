import { describe, expect, it } from "vitest";
import { onboardingRoleSelection } from "@/modules/people/college-faculty-onboarding-model";

describe("College Admin Faculty onboarding role contract", () => {
  it("always submits only the Faculty role for the dedicated form", () => {
    expect(onboardingRoleSelection("FACULTY")).toEqual(["FACULTY"]);
    expect(onboardingRoleSelection("FACULTY", ["TPO", "LEARNER", "COLLEGE_ADMIN"]))
      .toEqual(["FACULTY"]);
  });
  it("preserves general multi-role onboarding behavior", () => {
    expect(onboardingRoleSelection()).toEqual(["LEARNER"]);
    expect(onboardingRoleSelection(undefined, ["LEARNER", "FACULTY", "LEARNER"]))
      .toEqual(["LEARNER", "FACULTY"]);
  });
});
