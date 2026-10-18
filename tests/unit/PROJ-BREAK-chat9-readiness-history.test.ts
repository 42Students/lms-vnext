import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { readProjectReadinessOverride } from "@/modules/projects/readiness-override-service";

vi.mock("server-only", () => ({}));

type Reader = Parameters<typeof readProjectReadinessOverride>[0];
type ReadinessRow = {
  metadata: Record<string, unknown> | null;
  occurredAt: Date;
  overriddenBy: string | null;
};

function reader(rows: ReadinessRow[]): Reader {
  const query = {
    limit: async (_count: number) => rows.slice(0, 1),
  };
  return {
    select: () => ({
      from: () => ({
        leftJoin: () => ({
          where: () => ({
            orderBy: () => query,
          }),
        }),
      }),
    }),
  } as unknown as Reader;
}

const projectId = "11111111-1111-4111-8111-111111111111";
const collegeId = "22222222-2222-4222-8222-222222222222";
const occurredAt = new Date("2026-10-18T10:10:10.000Z");

describe("IIT Dharwad: college-scoped Projects readiness override history", () => {
  it("PROJ-BREAK-readiness-30 an untouched workspace has no phantom override or actor", async () => {
    expect(await readProjectReadinessOverride(reader([]), projectId, collegeId)).toEqual({
      state: null, note: null, occurredAt: null, overriddenBy: null,
    });
  });

  it("PROJ-BREAK-readiness-31 active block and unlock states preserve the audited reason and author", async () => {
    for (const state of ["FORCE_BLOCK", "FORCE_UNLOCK"]) {
      const value = await readProjectReadinessOverride(reader([
        { metadata: { state, note: "Approved by board" }, occurredAt, overriddenBy: "College Admin" },
      ]), projectId, collegeId);
      expect(value).toEqual({
        state, note: "Approved by board", occurredAt, overriddenBy: "College Admin",
      });
    }
  });

  it("PROJ-BREAK-readiness-32 a CLEAR action drops stale block reasons", async () => {
    expect(await readProjectReadinessOverride(reader([
      { metadata: { state: "CLEAR", note: "old confidential reason" }, occurredAt, overriddenBy: null },
    ]), projectId, collegeId)).toEqual({
      state: "CLEAR", note: null, occurredAt, overriddenBy: null,
    });
  });

  it("PROJ-BREAK-readiness-33 malformed metadata fails closed instead of exposing arbitrary state", async () => {
    for (const metadata of [null, {}, { state: "FORCE_BYPASS", note: 42 }, { state: 7, note: "unknown" }]) {
      const result = await readProjectReadinessOverride(reader([
        { metadata, occurredAt, overriddenBy: "Reviewer" },
      ]), projectId, collegeId);
      expect(result.state).toBeNull();
      expect(result.note).toBeNull();
      expect(result.overriddenBy).toBe("Reviewer");
    }
  });

  it("PROJ-BREAK-idor-30 SQL constrains both project and college and orders the most recent event", () => {
    const source = readFileSync("src/modules/projects/readiness-override-service.ts", "utf8");
    expect(source).toContain("eq(activityEvents.subjectId,projectId)");
    expect(source).toContain("eq(activityEvents.collegeId,collegeId)");
    expect(source).toContain("desc(activityEvents.occurredAt),desc(activityEvents.id)");
    expect(source).toContain("limit(1)");
  });
});
