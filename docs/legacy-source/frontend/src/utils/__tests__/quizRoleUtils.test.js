import { resolveEffectiveUserType } from "../quizRoleUtils";

describe("resolveEffectiveUserType", () => {
  // The actual bug: a faculty member previewing a quiz via the <iframe embed=roadmap> flow gets
  // an unhydrated Redux loginUser (nolayout page, fresh browsing context) -- if the JWT itself
  // says FACULTY, that must win, not silently fall through to the "unknown -> treat as learner"
  // default that let the real submit-answers UI render for a teacher.
  test("prefers the token's userType over Redux's when both are present and disagree", () => {
    expect(resolveEffectiveUserType({ userType: "FACULTY" }, { userType: "LEARNER" })).toBe("FACULTY");
  });

  test("falls back to Redux's loginUser when no token payload is available yet", () => {
    expect(resolveEffectiveUserType(null, { userType: "LEARNER" })).toBe("LEARNER");
    expect(resolveEffectiveUserType(undefined, { userType: "FACULTY" })).toBe("FACULTY");
  });

  test("falls back to the token when Redux's loginUser hasn't hydrated (the iframe-preview case)", () => {
    expect(resolveEffectiveUserType({ userType: "FACULTY" }, undefined)).toBe("FACULTY");
    expect(resolveEffectiveUserType({ userType: "FACULTY" }, {})).toBe("FACULTY");
  });

  test("returns undefined when neither source has a userType", () => {
    expect(resolveEffectiveUserType(null, null)).toBeUndefined();
    expect(resolveEffectiveUserType({}, {})).toBeUndefined();
  });

  test("an empty-string userType on the token is treated as absent, not a real value", () => {
    expect(resolveEffectiveUserType({ userType: "" }, { userType: "LEARNER" })).toBe("LEARNER");
  });
});
