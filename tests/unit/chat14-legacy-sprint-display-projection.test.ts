import {describe,expect,it} from "vitest";
import {projectSprintLegacyDisplayProjection} from "@/db/schema/projects";

const canonical={
  status:"ACTIVE",
  legacyDerivedStatus:null as string|null,
  dueLabel:"End of week 4",
  legacyReleaseLabel:"Release A",
  startedAt:null as Date|null,
  completedAt:null as Date|null,
  startedByMembershipId:null as string|null,
  completedByMembershipId:null as string|null,
};
describe("legacy sprint derived status is distinct from lifecycle",()=>{
  it("shows an imported OVERDUE derived state without rewriting ACTIVE",()=>{
    const actual=projectSprintLegacyDisplayProjection({
      ...canonical,legacyDerivedStatus:"overdue",
    });
    expect(actual.canonicalLifecycle).toBe("ACTIVE");
    expect(actual.taskDerivedStatus).toBe("OVERDUE");
    expect(actual.displayStatus).toBe("OVERDUE");
    expect(actual.releaseLabelFallback).toBe("Release A");
    expect(actual.dueLabel).toBe("End of week 4");
  });
  it("preserves untrusted imported values for review without presenting them",()=>{
    const actual=projectSprintLegacyDisplayProjection({
      ...canonical,legacyDerivedStatus:"DELETE_EVERYTHING",
    });
    expect(actual.taskDerivedStatus).toBeNull();
    expect(actual.displayStatus).toBe("ACTIVE");
    expect(actual.taskDerivedStatusNeedsReview).toBe(true);
  });
  it("does not invent start/completion actors when only dates survived",()=>{
    const actual=projectSprintLegacyDisplayProjection({
      ...canonical,startedAt:new Date("2026-01-05T12:00:00.000Z"),
      completedAt:new Date("2026-01-09T12:00:00.000Z"),
    });
    expect(actual.attributionComplete).toBe(false);
    expect(actual.startedByMembershipId).toBeNull();
  });
});
