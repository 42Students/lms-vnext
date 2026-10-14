import { describe, expect, it } from "vitest";
import { resolveOwnInterviewDeepLink } from "@/modules/placements/learner-interview-deeplink-model";

const applicationId = "81818181-8181-4818-8818-818181818181";
const roundId = "82828282-8282-4828-8828-828282828282";
const other = "83838383-8383-4838-8838-838383838383";
const ownRows = [
  { applicationId, roundId, roundKind: "INTERVIEW" },
  { applicationId, roundId: other, roundKind: "TEST" },
];

describe("learner scoped interview deep link", () => {
  it("defaults to all interviews and opens exactly the owned interview", () => {
    expect(resolveOwnInterviewDeepLink(ownRows, {})).toEqual({ valid: true, key: null });
    expect(resolveOwnInterviewDeepLink(ownRows, { applicationId, roundId }))
      .toEqual({ valid: true, key: applicationId + ":" + roundId });
  });
  it("refuses foreign, assessment, partial, malformed and injected identifiers", () => {
    for (const input of [
      { applicationId: other, roundId },
      { applicationId, roundId: other },
      { applicationId },
      { roundId },
      { applicationId, roundId: "bad" },
      { applicationId: [applicationId], roundId },
      { applicationId, roundId, collegeId: other },
    ]) {
      expect(resolveOwnInterviewDeepLink(ownRows, input)).toEqual({ valid: false });
    }
  });
});
