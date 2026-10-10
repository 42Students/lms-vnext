import { describe, expect, it } from "vitest";
import {
  createTpoLeadSchema,
  updateTpoLeadSchema,
  checkTpoLeadContactSchema,
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

  it("preserves V161 recruiter lead source codes and human labels", () => {
    expect(createTpoLeadSchema.parse({
      collegeId, name: "Source A", email: "a@example.org",
      source: "LinkedIn",
    }).source).toBe("LINKEDIN");
    expect(createTpoLeadSchema.parse({
      collegeId, name: "Source B", email: "b@example.org",
      source: "Event or job fair",
    }).source).toBe("EVENT");
    expect(() => createTpoLeadSchema.parse({
      collegeId, name: "Source C", email: "c@example.org",
      source: "ARBITRARY_SOURCE",
    })).toThrow();
    expect(() => createTpoLeadSchema.parse({
      collegeId, name: "Source D", email: "d@example.org",
      source: "IMPORT",
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


describe("W05 recruiter lead edit and duplicate-check boundaries", () => {
  it("allows updating one contact without deleting the other implicitly", () => {
    expect(updateTpoLeadSchema.parse({
      collegeId, name: "Corrected name",
    })).toEqual({ collegeId, name: "Corrected name" });
    expect(updateTpoLeadSchema.parse({
      collegeId, phone: null,
    })).toEqual({ collegeId, phone: null });
    expect(updateTpoLeadSchema.parse({
      collegeId, email: "  Edited@Example.Org  ",
    }).email).toBe("edited@example.org");
  });

  it("rejects no-op updates and hidden owner/status/invite manipulation", () => {
    for (const input of [
      { collegeId },
      { collegeId, manualStage: "CONTACTED" },
      { collegeId, recruiterUserId: collegeId, name: "Forged" },
      { collegeId, inviteTokenHash: "stolen", name: "Forged" },
      { collegeId, ownerMembershipId: collegeId, name: "Forged" },
      { collegeId, name: "   " },
      { collegeId, companyName: "" },
      { collegeId, source: "IMPORT" },
    ]) {
      expect(() => updateTpoLeadSchema.parse(input)).toThrow();
    }
  });

  it("normalizes approved source labels and permits explicit reset", () => {
    expect(updateTpoLeadSchema.parse({
      collegeId, source: "Event or job fair",
    }).source).toBe("EVENT");
    expect(updateTpoLeadSchema.parse({
      collegeId, source: null,
    }).source).toBeNull();
  });

  it("validates duplicate-check email or phone, never arbitrary search", () => {
    expect(checkTpoLeadContactSchema.parse({
      collegeId, contact: "  LEAD@EXAMPLE.ORG  ",
    }).contact).toBe("LEAD@EXAMPLE.ORG");
    expect(checkTpoLeadContactSchema.parse({
      collegeId, contact: "+91 98765 43210",
    }).contact).toBe("+91 98765 43210");
    for (const contact of ["", "x", "not-an-email@", "() ---", "hello world"]) {
      expect(() => checkTpoLeadContactSchema.parse({
        collegeId, contact,
      })).toThrow();
    }
  });
});
