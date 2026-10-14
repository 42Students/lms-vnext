import { describe, expect, it } from "vitest";
import {
  projectTpoDriveCloseout, tpoDriveCloseoutCsv,
} from "@/modules/placements/tpo-drive-closeout-model";
describe("TPO drive close-out semantics", () => {
  it("counts persisted distinct members and distinguishes offer versions", () => {
    const actual = projectTpoDriveCloseout([
      { id: "a", membershipId: "m1", status: "SUBMITTED", screeningStatus: "SHORTLISTED" },
      { id: "b", membershipId: "m2", status: "WITHDRAWN", screeningStatus: "SHORTLISTED" },
    ], [
      { id: "v1", applicationId: "a", membershipId: "m1", status: "WITHDRAWN", joiningStatus: null },
      { id: "v2", applicationId: "a", membershipId: "m1", status: "ACCEPTED", joiningStatus: "JOINED" },
    ]);
    expect(actual).toEqual({
      applied: 2, currentlySubmitted: 1, shortlisted: 1,
      selected: null, offered: 1, offerVersions: 2, accepted: 1, joined: 1,
    });
  });
  it("does not present no persisted applications as selected and CSV neutralizes formulas", () => {
    const summary = projectTpoDriveCloseout([], []);
    expect(summary.selected).toBeNull();
    const csv = tpoDriveCloseoutCsv("=BAD()", summary);
    expect(csv).toContain("\"'=BAD()\"");
    expect(csv).toContain("Unavailable: no canonical persisted final selection signal");
  });
});
