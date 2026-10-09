import { describe, expect, it } from "vitest";
import {
  createTpoLeadSchema,
  createTpoFollowupSchema,
  logTpoLeadActivitySchema,
  markTpoNotNowSchema,
  moveTpoFollowupSchema,
} from "@/modules/placements/tpo-crm-validation";

const collegeId = "20000000-0000-4000-8000-000000000001";

describe("DB09 recruiter CRM input contracts", () => {
  it("requires a contact and rejects spoofed owner/tenant internals", () => {
    expect(() => createTpoLeadSchema.parse({
      collegeId, name: "Recruiter A",
    })).toThrow();
    expect(() => createTpoLeadSchema.parse({
      collegeId, name: "Recruiter A", email: "a@example.com",
      ownerMembershipId: "40000000-0000-4000-8000-000000000005",
    })).toThrow();
  });

  it("accepts both email and phone, normalizes email, checks bounds", () => {
    expect(createTpoLeadSchema.parse({
      collegeId,
      name: "  Lead One  ",
      email: "  PERSON@EXAMPLE.COM  ",
      phone: "+91 98765 43210",
    })).toMatchObject({
      name: "Lead One",
      email: "person@example.com",
    });
    expect(() => createTpoLeadSchema.parse({
      collegeId,
      name: "Test",
      phone: "invalid",
    })).toThrow();
  });

  it("prevents callers from manufacturing SYSTEM audit activity", () => {
    expect(logTpoLeadActivitySchema.parse({
      collegeId, type: "CALL", note: "Spoke to recruiter",
    }).type).toBe("CALL");
    expect(() => logTpoLeadActivitySchema.parse({
      collegeId, type: "SYSTEM", note: "forged",
    })).toThrow();
    expect(() => logTpoLeadActivitySchema.parse({
      collegeId, type: "CALL", isSystem: true,
    })).toThrow();
  });

  it("requires offset-aware due dates and valid revisit dates", () => {
    const dueAt = "2026-10-15T09:30:00+05:30";
    expect(createTpoFollowupSchema.parse({
      collegeId, dueAt,
    }).dueAt).toBe(dueAt);
    expect(moveTpoFollowupSchema.parse({
      collegeId, dueAt,
    }).dueAt).toBe(dueAt);
    expect(() => createTpoFollowupSchema.parse({
      collegeId, dueAt: "2026-10-15T09:30:00",
    })).toThrow();
    expect(markTpoNotNowSchema.parse({
      collegeId,
      reason: "Check next month",
      revisitDate: "2026-11-10",
    }).revisitDate).toBe("2026-11-10");
    expect(() => markTpoNotNowSchema.parse({
      collegeId, revisitDate: "10/11/2026",
    })).toThrow();
  });
});
