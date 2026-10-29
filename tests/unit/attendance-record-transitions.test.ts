import { describe, expect, it } from "vitest";
import { planAttendanceRecordTransitions } from "@/modules/attendance/attendance-record-transitions";

const a = {id: "row-a", membershipId: "a", status: "ABSENT"};
const b = {id: "row-b", membershipId: "b", status: "LATE"};
const c = {id: "row-c", membershipId: "c", status: "EXCUSED"};
const d = {id: "row-d", membershipId: "d", status: "MEDICAL"};
const e = {id: "row-e", membershipId: "e", status: "PRESENT"};

describe("DB06 attendance stable-record correction planner", () => {
  it("updates an absence to PRESENT without destroying its immutable record ID", () => {
    expect(planAttendanceRecordTransitions([a], [], ["a"])).toEqual({
      previousAbsentMembershipIds: ["a"],
      insertAbsentMembershipIds: [],
      changeToAbsentRecordIds: [],
      changeToPresentRecordIds: ["row-a"],
    });
  });

  it("preserves admin-coded LATE/EXCUSED/MEDICAL/PRESENT on unrelated students", () => {
    expect(planAttendanceRecordTransitions([b,c,d,e], [], ["b","c","d","e"])).toEqual({
      previousAbsentMembershipIds: [],
      insertAbsentMembershipIds: [],
      changeToAbsentRecordIds: [],
      changeToPresentRecordIds: [],
    });
  });

  it("inserts only never-recorded absences and reuses existing records otherwise", () => {
    expect(planAttendanceRecordTransitions([a,b,c], ["a","b","new"], ["c"])).toEqual({
      previousAbsentMembershipIds: ["a"],
      insertAbsentMembershipIds: ["new"],
      changeToAbsentRecordIds: ["row-b"],
      changeToPresentRecordIds: [],
    });
  });

  it("does not rewrite unchanged absence rows while correcting another student", () => {
    expect(planAttendanceRecordTransitions([a,b], ["a"], ["b"])).toMatchObject({
      insertAbsentMembershipIds: [],
      changeToAbsentRecordIds: [],
      changeToPresentRecordIds: [],
    });
  });

  it("rejects impossible duplicate rows, duplicate submissions or unreviewed records", () => {
    expect(() => planAttendanceRecordTransitions([a,a], ["a"], []))
      .toThrow("ATTENDANCE_DUPLICATE_CURRENT_RECORD");
    expect(() => planAttendanceRecordTransitions([], ["a"], ["a"]))
      .toThrow("ATTENDANCE_DUPLICATE_ROSTER_MEMBER");
    expect(() => planAttendanceRecordTransitions([a], [], ["b"]))
      .toThrow("ATTENDANCE_RECORD_OUTSIDE_REQUESTED_ROSTER");
  });
});
