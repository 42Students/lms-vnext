import { dropAction, dropHint, lockedReason } from "../ui/recruiterLeadBoardRules";

describe("lead board drops", () => {
  it("hand-set stages can be dropped on", () => {
    expect(dropAction("NEW", "CONTACTED")).toBe("MARK_CONTACTED");
    expect(dropAction("CONTACTED", "NOT_NOW")).toBe("NOT_NOW");
    expect(dropAction("NOT_NOW", "CONTACTED")).toBe("MARK_CONTACTED");
  });
  it("a stage that is a fact starts the action that makes it true", () => {
    expect(dropAction("NEW", "INVITED")).toBe("INVITE");
    expect(dropAction("CONTACTED", "INVITED")).toBe("INVITE");
    expect(dropAction("JOINED", "DRIVE_PLANNED")).toBe("CREATE_DRIVE");
  });
  it("stages the system works out can never be dropped on, and a recruited company cannot be parked", () => {
    expect(dropAction("CONTACTED", "JOINED")).toBeNull();
    expect(dropAction("JOINED", "RECRUITED")).toBeNull();
    expect(dropAction("CONTACTED", "NEW")).toBeNull();
    expect(dropAction("RECRUITED", "NOT_NOW")).toBeNull();
    expect(dropAction("NEW", "NEW")).toBeNull();
    expect(dropAction("NEW", undefined)).toBeNull();
  });
  it("explains why a column is locked, and what a drop will do", () => {
    expect(lockedReason("JOINED")).toMatch(/recruiter accepts/);
    expect(lockedReason("RECRUITED")).toMatch(/accepts an offer/);
    expect(lockedReason("CONTACTED")).toBeNull();
    expect(dropHint("INVITE")).toBe("Drop to send an invite");
    expect(dropHint(null)).toBe("");
  });
});
