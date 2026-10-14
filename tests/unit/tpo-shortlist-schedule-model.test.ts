import { describe, expect, it } from "vitest";
import { projectTpoDriveScheduleWarnings } from "@/modules/placements/tpo-drive-schedule-warnings-model";
import {
  projectTpoScheduleConflicts,
  tpoScheduleConflictsQuerySchema,
  type TpoScheduleRoundFact,
} from "@/modules/placements/tpo-schedule-conflicts-model";
import {
  projectTpoShortlist,
  tpoShortlistCsv,
  tpoShortlistQuerySchema,
} from "@/modules/placements/tpo-shortlist-model";

const uuid = (n: number) => "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
const start = new Date("2026-10-15T04:00:00.000Z");
function round(n: number, overrides: Partial<TpoScheduleRoundFact> = {}): TpoScheduleRoundFact {
  return {
    id: uuid(n), jobId: uuid(n + 100), jobTitle: "Drive " + n,
    companyName: "Company", name: "Interview", mode: "ON_CAMPUS",
    venue: "Lab A", scheduledAt: start, durationMinutes: 60, ...overrides,
  };
}

describe("TPO schedule conflict model", () => {
  it("flags true same-venue overlapping half-open intervals only", () => {
    const value = projectTpoScheduleConflicts([
      round(1),
      round(2, { venue: " lab   a ", scheduledAt: new Date("2026-10-15T04:30:00.000Z") }),
      round(3, { venue: "Lab A", scheduledAt: new Date("2026-10-15T05:00:00.000Z") }),
      round(4, { venue: "Lab B", scheduledAt: new Date("2026-10-15T04:30:00.000Z") }),
    ]);
    expect(value.conflicts.map((c) => [c.left.id, c.right.id, c.overlapMinutes]))
      .toEqual([[uuid(1), uuid(2), 30], [uuid(2), uuid(3), 30]]);
    expect(value.totalScheduled).toBe(4);
    expect(value.assessedCount).toBe(4);
  });

  it("never calls missing or virtual bookings conflict-free", () => {
    const value = projectTpoScheduleConflicts([
      round(1, { venue: null }),
      round(2, { durationMinutes: null }),
      round(3, { mode: null }),
      round(4, { mode: "VIRTUAL", venue: "Lab A" }),
    ]);
    expect(value.conflicts).toHaveLength(0);
    expect(value.unassessable).toHaveLength(3);
    expect(value.virtualExcluded).toBe(1);
    expect(value.assessedCount).toBe(0);
  });

  it("validates a bounded strict scheduling range", () => {
    expect(tpoScheduleConflictsQuerySchema.parse({ days: "30" })).toEqual({ days: 30 });
    expect(tpoScheduleConflictsQuerySchema.safeParse({ days: 91 }).success).toBe(false);
    expect(tpoScheduleConflictsQuerySchema.safeParse({ days: 0 }).success).toBe(false);
    expect(tpoScheduleConflictsQuerySchema.safeParse({ collegeId: uuid(10) }).success).toBe(false);
  });
});

describe("TPO current shortlist model", () => {
  it("preserves nullable decision timestamps and neutralizes CSV formulae", () => {
    const projected = projectTpoShortlist([{
      applicationId: uuid(1), membershipId: uuid(2),
      name: '=HYPERLINK("bad")', rollNumber: "+12",
      roleTitle: "Engineer", decidedAt: null,
    }]);
    expect(projected[0]?.shortlistedAtIso).toBeNull();
    const csv = tpoShortlistCsv(projected);
    expect(csv).toContain("\"'=HYPERLINK(\"\"bad\"\")\"");
    expect(csv).toContain("\"'+12\"");
    expect(csv).toContain('"Engineer"');
    expect(csv.split("\r\n")).toHaveLength(2);
  });

  it("returns a headings-only CSV for no current shortlisted applicants", () => {
    const csv = tpoShortlistCsv(projectTpoShortlist([]));
    expect(csv).toContain('"Roll number"');
    expect(csv.split("\r\n")).toHaveLength(1);
  });

  it("rejects forged college scopes and invalid IDs/pages", () => {
    expect(tpoShortlistQuerySchema.parse({ jobId: uuid(1), page: "2" }))
      .toEqual({ jobId: uuid(1), page: 2 });
    expect(tpoShortlistQuerySchema.safeParse({ jobId: "bad" }).success).toBe(false);
    expect(tpoShortlistQuerySchema.safeParse({ jobId: uuid(1), page: 0 }).success).toBe(false);
    expect(tpoShortlistQuerySchema.safeParse({ jobId: uuid(1), collegeId: uuid(2) }).success).toBe(false);
  });
});


describe("inline TPO drive scheduling warnings", () => {
  const current = "00000000-0000-4000-8000-000000000001";
  const other = "00000000-0000-4000-8000-000000000002";
  const snapshot = {
    limited: false,
    conflicts: [{
      left: { id: current, companyName: "Own employer", jobTitle: "Role", name: "Interview", venue: "Lab A" },
      right: { id: other, companyName: "Other employer", jobTitle: "QA", name: "Interview", venue: "Lab A" },
      overlapMinutes: 30,
    }],
    unassessable: [{ id: current, reason: "Duration not recorded" }],
  };

  it("only projects warnings on rounds in the current drive", () => {
    const data = projectTpoDriveScheduleWarnings(snapshot, [current]);
    expect(data).toMatchObject({ state: "AVAILABLE", collisions: 1, unknown: 1 });
    expect(data.warnings).toHaveLength(1);
    expect(data.warnings[0]?.roundId).toBe(current);
    expect(data.warnings[0]?.messages.join(" ")).toContain("Other employer");
  });

  it("does not invent a conflict-free assessment on failure or cap", () => {
    expect(projectTpoDriveScheduleWarnings(null, [current])).toEqual({
      state: "UNAVAILABLE", collisions: 0, unknown: 0, warnings: [],
    });
    expect(projectTpoDriveScheduleWarnings({ ...snapshot, limited: true }, [current]).state)
      .toBe("LIMITED");
  });

  it("does not leak other-job round warnings into this drive", () => {
    const unrelated = "00000000-0000-4000-8000-000000000099";
    const value = projectTpoDriveScheduleWarnings(snapshot, [unrelated]);
    expect(value.warnings).toEqual([]);
    expect(value.collisions).toBe(0);
    expect(value.unknown).toBe(0);
  });
});
