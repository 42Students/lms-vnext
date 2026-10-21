import { normalizeCourseTakeaways, parsePastedCourseTakeaways } from "../adminCourseTakeaways";

describe("course takeaway editing", () => {
  test("normalizes create and edit arrays without losing order", () => {
    expect(normalizeCourseTakeaways(["  First  ", "", " Second ", null, "Third"]))
      .toEqual(["First", "Second", "Third"]);
  });
  test("migrates legacy newline text and Windows newline values", () => {
    expect(normalizeCourseTakeaways("First\r\n\r\nSecond\nThird"))
      .toEqual(["First", "Second", "Third"]);
  });
  test("pasted numbered and bullet points become clean ordered entries", () => {
    expect(parsePastedCourseTakeaways("1. First\n- Second\n• Third\n4) Fourth"))
      .toEqual(["First", "Second", "Third", "Fourth"]);
  });
  test("does not rewrite text within a takeaway", () => {
    expect(parsePastedCourseTakeaways("Learn 2.0 APIs\n\nBuild React/Next apps"))
      .toEqual(["Learn 2.0 APIs", "Build React/Next apps"]);
  });
  test("empty and malformed optional values produce no points", () => {
    expect(normalizeCourseTakeaways(null)).toEqual([]);
    expect(normalizeCourseTakeaways({ unexpected: true })).toEqual([]);
  });
});
