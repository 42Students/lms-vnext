import { describe, it, expect } from "vitest";
import { lectureHallScheduledConflict } from "@/modules/academics/lecture-hall-conflict-model";

describe("lecture hall future session conflicts", () => {
  it("rejects archiving when a scheduled session row exists", () => {
    expect(lectureHallScheduledConflict({
      archiving: true, scheduledCapacityRows: [null],
    })).toBe("HALL_IN_USE");
  });
  it("blocks reduced capacity beneath scheduled class capacity", () => {
    expect(lectureHallScheduledConflict({
      archiving: false, nextCapacity: 19, scheduledCapacityRows: [20, null],
    })).toBe("HALL_CAPACITY_CONFLICT");
  });
  it("allows no upcoming sessions and permitted capacity", () => {
    expect(lectureHallScheduledConflict({
      archiving: true, nextCapacity: 8, scheduledCapacityRows: [],
    })).toBeNull();
    expect(lectureHallScheduledConflict({
      archiving: false, nextCapacity: 20, scheduledCapacityRows: [20, null],
    })).toBeNull();
  });
});
