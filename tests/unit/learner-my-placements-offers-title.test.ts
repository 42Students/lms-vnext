import { describe, expect, it } from "vitest";
import { LEARNER_LEGACY_OFFERS_TITLE } from "@/modules/placements/learner-placement-copy-model";

describe("learner My Placements exact dev legacy title",()=>{
  it("uses the dev legacy offers heading rather than old My offers",()=>{
    expect(LEARNER_LEGACY_OFFERS_TITLE).toBe("Your offers");
  });
});
