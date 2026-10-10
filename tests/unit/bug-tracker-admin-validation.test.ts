import { describe, expect, it } from "vitest";
import {
  trackerAdminListSchema,
  trackerPublicIdSchema,
  trackerRetestSchema,
  trackerWorkflowUpdateSchema,
} from "@/modules/bug-tracker/admin-validation";

describe("W06 Tracker admin validation", () => {
  it("accepts exact source enums and paired cursor", () => {
    const parsed = trackerAdminListSchema.parse({
      status: "READY_FOR_RETEST",
      severity: "CRITICAL",
      environment: "PRODUCTION",
      q: " login ",
      sort: "newest",
      beforeCreatedAt: "2026-10-10T10:00:00.000Z",
      beforeId: "10000000-0000-4000-8000-000000000001",
      limit: "50",
    });
    expect(parsed.q).toBe("login");
    expect(parsed.beforeCreatedAt).toBeInstanceOf(Date);
    expect(parsed.limit).toBe(50);
  });

  it("rejects partial cursors, spoofed extra filters and invalid enums", () => {
    for (const value of [
      { beforeId: "10000000-0000-4000-8000-000000000001" },
      { beforeCreatedAt: "2026-10-10T10:00:00.000Z" },
      { status: "RESOLVED" },
      { severity: "P0" },
      { environment: "STAGING" },
      { collegeId: "20000000-0000-4000-8000-000000000001" },
    ]) {
      expect(trackerAdminListSchema.safeParse(value).success).toBe(false);
    }
  });

  it("accepts normalized public references only", () => {
    expect(trackerPublicIdSchema.parse(" lms-0001 ")).toBe("lms-0001");
    for (const value of ["1", "LMS-1", "BUG-0001", "LMS-0001/../../x"]) {
      expect(trackerPublicIdSchema.safeParse(value).success).toBe(false);
    }
  });

  it("requires optimistic versions and rejects client-supplied actor fields", () => {
    expect(trackerWorkflowUpdateSchema.safeParse({
      expectedVersion: 3,
      status: "FIXING",
      productionVerified: false,
    }).success).toBe(true);
    expect(trackerWorkflowUpdateSchema.safeParse({
      expectedVersion: 3,
      status: "FIXING",
      actorUserId: "30000000-0000-4000-8000-000000000001",
    }).success).toBe(false);
    expect(trackerWorkflowUpdateSchema.safeParse({
      expectedVersion: -1,
      status: "FIXING",
    }).success).toBe(false);
  });

  it("validates retest state payload shape strictly", () => {
    expect(trackerRetestSchema.parse({
      expectedVersion: 1,
      result: "PASS",
      note: "verified",
    })).toMatchObject({ result: "PASS" });
    expect(trackerRetestSchema.safeParse({
      expectedVersion: 1,
      result: "SKIP",
    }).success).toBe(false);
  });
});
