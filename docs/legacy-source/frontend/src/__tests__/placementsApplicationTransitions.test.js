import {
  buildBulkStatusPreview,
  canAdminTransitionApplication,
  getAdminValidApplicationTransitions,
  partitionAdminTransitionTargets,
  reconcileSelectedApplicationIds,
} from "@/utils/placementApplicationTransitions";

describe("placement admin application transition parity", () => {
  test("includes backend-supported waitlist routes and interview-to-assessment correction", () => {
    expect(getAdminValidApplicationTransitions("SHORTLISTED")).toContain("WAITLISTED");
    expect(getAdminValidApplicationTransitions("ASSESSMENT")).toContain("WAITLISTED");
    expect(getAdminValidApplicationTransitions("INTERVIEW")).toEqual(
      expect.arrayContaining(["ASSESSMENT", "WAITLISTED", "OFFERED", "REJECTED"])
    );
  });

  test("never exposes learner-only WITHDRAWN as an admin destination", () => {
    [
      "APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW",
      "WAITLISTED", "OFFERED", "REJECTED", "HIRED",
    ].forEach((status) => {
      expect(getAdminValidApplicationTransitions(status)).not.toContain("WITHDRAWN");
    });
  });

  test("waitlist is a first-class state, not an alias for interview or offer", () => {
    expect(canAdminTransitionApplication("WAITLISTED", "OFFERED")).toBe(true);
    expect(canAdminTransitionApplication("WAITLISTED", "REJECTED")).toBe(true);
    expect(canAdminTransitionApplication("WAITLISTED", "HIRED")).toBe(false);
  });

  test("mixed bulk selection is partitioned using the same state machine", () => {
    const result = partitionAdminTransitionTargets([
      { id: 1, status: "APPLIED" },
      { id: 2, status: "HIRED" },
      { id: 3, status: "APPLIED" },
    ], "SHORTLISTED");

    expect(result.valid.map((row) => row.id)).toEqual([1, 3]);
    expect(result.invalid.map((row) => row.id)).toEqual([2]);
  });

  test("unknown or missing row status fails closed in bulk preflight", () => {
    const result = partitionAdminTransitionTargets([
      { id: 1, status: undefined },
      { id: 2, status: "SOMETHING_NEW" },
    ], "REJECTED");

    expect(result.valid).toEqual([]);
    expect(result.invalid).toHaveLength(2);
  });

  test("same-status writes remain valid no-ops, matching backend behavior", () => {
    expect(canAdminTransitionApplication("APPLIED", "APPLIED")).toBe(true);
  });

  test("stale bulk-selection ids are removed after a successful data refresh", () => {
    expect(reconcileSelectedApplicationIds(
      [1, "2", 999, "bad"],
      [{ id: 1 }, { id: "2" }, { id: 3 }]
    )).toEqual([1, 2]);
  });

  test("selection is cleared when no previously selected rows remain live", () => {
    expect(reconcileSelectedApplicationIds([1, 2], [])).toEqual([]);
    expect(reconcileSelectedApplicationIds(null, [{ id: 1 }])).toEqual([]);
  });

});

describe("buildBulkStatusPreview (PVN-001.24)", () => {
  const rows = new Map([
    [1, { learner: { firstName: "Asha", lastName: "Rao" } }],
    [2, { learner: { firstName: "Ravi", lastName: "" } }],
    [3, {}],
  ]);

  test("names the count, the target and real learner names", () => {
    const p = buildBulkStatusPreview([1, 2], "SHORTLISTED", rows, "Shortlisted");
    expect(p.title).toBe("Move 2 applications to Shortlisted?");
    expect(p.sample).toEqual(["Asha Rao", "Ravi"]);
    expect(p.more).toBe(0);
    expect(p.danger).toBe(false);
  });

  test("falls back to the application id when no learner is loaded, and caps the sample at five", () => {
    const ids = [1, 2, 3, 4, 5, 6, 7];
    const p = buildBulkStatusPreview(ids, "OFFERED", rows, "Offered");
    expect(p.sample).toHaveLength(5);
    expect(p.sample[2]).toBe("Application #3");
    expect(p.more).toBe(2);
  });

  test("Hire is flagged dangerous and says its other applications are withdrawn", () => {
    const p = buildBulkStatusPreview([1], "HIRED", rows, "Hired");
    expect(p.title).toBe("Move 1 application to Hired?");
    expect(p.danger).toBe(true);
    expect(p.consequences.join(" ")).toMatch(/other active applications are withdrawn/);
    expect(p.consequences.join(" ")).toMatch(/cannot be undone/);
  });

  test("a status without bespoke copy still states that students are told", () => {
    expect(buildBulkStatusPreview([1], "WHATEVER", rows).consequences[0]).toMatch(/told/);
  });
});
