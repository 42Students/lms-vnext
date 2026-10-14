import { describe, expect, it } from "vitest";
import {
  decideTpoCompanyLifecycle,
  tpoCompanyLifecycleSchema,
} from "@/modules/placements/tpo-company-lifecycle-model";

const now = new Date("2026-10-14T08:00:00.000Z");
const id = "00000000-0000-4000-8000-000000000001";
const common = {
  companyId: id,
  expectedUpdatedAt: now.toISOString(),
  confirmed: true,
  reason: "Employer relationship review",
} as const;

describe("TPO company lifecycle pure decisions", () => {
  it("requires a strict confirmed reason and only relationship fields", () => {
    expect(tpoCompanyLifecycleSchema.safeParse({
      ...common, action: "ARCHIVE",
    }).success).toBe(true);
    expect(tpoCompanyLifecycleSchema.safeParse({
      ...common, action: "ARCHIVE", nextTrusted: true,
    }).success).toBe(false);
    expect(tpoCompanyLifecycleSchema.safeParse({
      ...common, action: "EDIT_TRUST",
    }).success).toBe(false);
    expect(tpoCompanyLifecycleSchema.safeParse({
      ...common, action: "EDIT_TRUST", nextTrusted: true,
    }).success).toBe(true);
    expect(tpoCompanyLifecycleSchema.safeParse({
      ...common, action: "RESTORE", confirmed: false,
    }).success).toBe(false);
    expect(tpoCompanyLifecycleSchema.safeParse({
      ...common, action: "RESTORE", collegeId: id,
    }).success).toBe(false);
  });

  it("blocks archiving active drives and stale snapshots", () => {
    const stored = { status: "ACTIVE", isTrusted: false, updatedAt: now };
    const archive = tpoCompanyLifecycleSchema.parse({
      ...common, action: "ARCHIVE",
    });
    expect(decideTpoCompanyLifecycle(stored, archive, true)).toBe("ACTIVE_DRIVES");
    expect(decideTpoCompanyLifecycle(stored, archive, false)).toBe("ALLOW");
    expect(decideTpoCompanyLifecycle({
      ...stored, updatedAt: new Date("2026-10-14T08:00:02Z"),
    }, archive, false)).toBe("STALE");
    expect(decideTpoCompanyLifecycle({
      ...stored, status: "ARCHIVED",
    }, archive, false)).toBe("STALE");
  });

  it("supports restoration and only a changed trust value", () => {
    const stored = { status: "ARCHIVED", isTrusted: false, updatedAt: now };
    const restore = tpoCompanyLifecycleSchema.parse({
      ...common, action: "RESTORE",
    });
    expect(decideTpoCompanyLifecycle(stored, restore, false)).toBe("ALLOW");
    const edit = tpoCompanyLifecycleSchema.parse({
      ...common, action: "EDIT_TRUST", nextTrusted: true,
    });
    expect(decideTpoCompanyLifecycle(stored, edit, false)).toBe("STALE");
    expect(decideTpoCompanyLifecycle({
      ...stored, status: "ACTIVE",
    }, edit, false)).toBe("ALLOW");
  });
});
