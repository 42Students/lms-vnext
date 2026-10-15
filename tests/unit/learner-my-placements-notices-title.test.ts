import { describe, expect, it } from "vitest";
import { LEARNER_LEGACY_NOTICES_TITLE, LEARNER_LEGACY_OFFERS_TITLE } from "@/modules/placements/learner-placement-copy-model";

describe("exact dev-legacy My Placements labels",()=>{
  it("uses Notices, not Announcements, for the notice page",()=>{
    expect(LEARNER_LEGACY_NOTICES_TITLE).toBe("Notices");
    expect(LEARNER_LEGACY_NOTICES_TITLE).not.toBe("Announcements");
    expect(LEARNER_LEGACY_OFFERS_TITLE).toBe("Your offers");
  });
});
