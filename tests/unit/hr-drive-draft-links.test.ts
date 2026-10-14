import { describe, expect, it } from "vitest";
import { recruiterDriveDraftHref } from "@/modules/placements/hr-drive-draft-links";

const collegeId = "00000000-0000-4000-8000-000000000010";
const jobId = "00000000-0000-4000-8000-000000000011";

describe("HR Request Drive navigation", () => {
  it("links to the authorized selected college", () => {
    expect(recruiterDriveDraftHref({collegeId})).toBe("/hr/drives/new?collegeId=" + collegeId);
  });

  it("links to Hire Again only using validated identifiers", () => {
    expect(recruiterDriveDraftHref({collegeId,fromJobId:jobId}))
      .toBe("/hr/drives/new?collegeId=" + collegeId + "&from=" + jobId);
    expect(() => recruiterDriveDraftHref({collegeId:"other"})).toThrow();
    expect(() => recruiterDriveDraftHref({collegeId,fromJobId:"not-an-id"})).toThrow();
  });
});
