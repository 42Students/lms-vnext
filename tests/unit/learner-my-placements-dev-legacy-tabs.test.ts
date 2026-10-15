import { describe, expect, it } from "vitest";
import { learnerPlacementsLegacyTabs } from "@/components/placements/learner-placements-tabs";

describe("Learner dev legacy My Placements tab strip (lists.js L378–388)", () => {
  it("matches the exact labels, hrefs and order", () => {
    expect(learnerPlacementsLegacyTabs.map(({label,href})=>[label,href])).toEqual([
      ["Home","/learn/my-placements"],
      ["Drives","/learn/my-placements/jobs"],
      ["Applications","/learn/my-placements/applications"],
      ["Schedule","/learn/my-placements/schedule"],
      ["Offers","/learn/my-placements/offers"],
      ["Notices","/learn/my-placements/announcements"],
      ["Placement cell","/learn/my-placements/placement"],
    ]);
  });
  it("does not show superseded legacy-redesign tabs", () => {
    const labels=learnerPlacementsLegacyTabs.map(item=>item.label);
    for(const name of ["Dashboard","Assessments","Interviews","Career Calendar","Announcements"]) {
      expect(labels).not.toContain(name);
    }
  });
});
