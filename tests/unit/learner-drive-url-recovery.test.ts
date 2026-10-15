import { describe, expect, it } from "vitest";
import { readLearnerDriveUrl } from "@/modules/placements/learner-drive-url-model";

describe("learner drive link recovery", () => {
  it("preserves valid filters when a foreign tenant selector is present", () => {
    expect(readLearnerDriveUrl("q=developer&sort=newest&collegeId=spoofed&page=3")).toMatchObject({
      filters:{search:"developer",sort:"newest"},page:3,
    });
  });
  it("rejects only duplicated or malformed facets without losing valid selections", () => {
    const result=readLearnerDriveUrl("q=Java&sort=wrong&availability=open&availability=closed&page=NaN");
    expect(result.filters.search).toBe("Java");
    expect(result.filters.sort).toBe("deadline");
    expect(result.filters.availability).toBe("all");
    expect(result.page).toBe(1);
  });
});