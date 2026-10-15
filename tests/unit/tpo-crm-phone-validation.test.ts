import { describe, expect, it } from "vitest";
import {
  checkTpoLeadContactSchema,
  createTpoLeadSchema,
  normalizedTpoLeadPhoneSchema,
  updateTpoLeadSchema,
} from "@/modules/placements/tpo-crm-validation";

const collegeId = "11111111-1111-4111-8111-111111111111";

describe("T-S2-02 recruiter phone validation", () => {
  it("normalizes before checking legacy 8–10 digit length", () => {
    expect(normalizedTpoLeadPhoneSchema.parse("+91 (98765) 43210")).toBe("9876543210");
    expect(normalizedTpoLeadPhoneSchema.parse(" 87654321 ")).toBe("87654321");
    expect(normalizedTpoLeadPhoneSchema.parse("   ")).toBeNull();
    expect(normalizedTpoLeadPhoneSchema.safeParse("1234567").success).toBe(false);
    expect(normalizedTpoLeadPhoneSchema.safeParse("123A567890").success).toBe(false);
    expect(normalizedTpoLeadPhoneSchema.safeParse("++++").success).toBe(false);
  });

  it("requires a real email or normalized phone on create", () => {
    const base = { collegeId, name: "Recruiter" };
    expect(createTpoLeadSchema.safeParse({ ...base, phone: "   " }).success).toBe(false);
    expect(createTpoLeadSchema.parse({ ...base, email: "person@company.in", phone: "" }).phone).toBeNull();
    expect(createTpoLeadSchema.parse({ ...base, phone: "(987) 654-3210" }).phone).toBe("9876543210");
  });

  it("does not allow an empty duplicate check or invalid update", () => {
    expect(checkTpoLeadContactSchema.safeParse({ collegeId, contact: " " }).success).toBe(false);
    expect(checkTpoLeadContactSchema.safeParse({ collegeId, contact: "1234567" }).success).toBe(false);
    expect(checkTpoLeadContactSchema.safeParse({ collegeId, contact: "+91 9876543210" }).success).toBe(true);
    expect(updateTpoLeadSchema.safeParse({ collegeId, phone: "1234" }).success).toBe(false);
    expect(updateTpoLeadSchema.parse({ collegeId, phone: "" }).phone).toBeNull();
  });
});
