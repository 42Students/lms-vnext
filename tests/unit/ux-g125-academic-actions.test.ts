import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parsePromotionAcademicYear } from "@/modules/academics/college-batch-promotion-model";
import { collegeHallBookingSchema } from "@/modules/academics/college-hall-booking-model";

const source = (file: string) => readFileSync(file, "utf8");

describe("UX-G125 academic year preview recovery", () => {
  it("accepts a valid next-year override and rejects invalid years", () => {
    expect(parsePromotionAcademicYear("2026-27")).toBe(2026);
    expect(parsePromotionAcademicYear("2099-00")).toBe(2099);
    expect(parsePromotionAcademicYear("2026-28")).toBeNull();
    expect(parsePromotionAcademicYear("1899-00")).toBeNull();
  });
  it("uses the server-owned academic-year parser before changing preview URL", () => {
    const component = source("src/components/academics/college-promotion-confirmation.tsx");
    expect(component).toContain("parsePromotionAcademicYear(yearValue.trim()) === null");
    expect(component).not.toContain("const matched=/^(\\\\d{4})");
    expect(component).toContain("submitInFlight.current = true");
    expect(component).toContain("submitInFlight.current = false");
  });
});

describe("UX-G125 hall booking validation and recovery", () => {
  it("retains server-side interval validation", () => {
    const booking = {sectionId: "00000000-0000-4000-8000-000000000001",
      facultyMembershipId: null, date: "2026-11-09", from: "10:00", to: "09:00",
      title: "Physics", expectedSectionUpdatedAt:"2026-11-08T08:00:00.000Z", confirm:true};
    expect(collegeHallBookingSchema.safeParse(booking).success).toBe(false);
    expect(collegeHallBookingSchema.safeParse({...booking,to:"11:00"}).success).toBe(true);
  });
  it("blocks invalid dates/times before confirmation and clears stale class dates", () => {
    const component = source("src/components/academics/college-hall-booking-action.tsx");
    expect(component).toContain("const invalidWindow=Boolean(from && to && to<=from)");
    expect(component).toContain("const invalidDate=Boolean(date && selected &&");
    expect(component).toContain("if(invalidWindow||invalidDate)");
    expect(component).toContain("setSectionId(e.target.value);setDate(\"\")");
    expect(component).toContain("disabled={pending||!sectionId||!date||!title.trim()||invalidWindow||invalidDate}");
  });
});

describe("UX-G125 async action retry protection", () => {
  it("releases semester delete lock after both success and failure", () => {
    const component = source("src/components/academics/college-semester-management.tsx");
    expect(component).toContain("if(pending || deleteInFlight.current)return");
    expect(component).toMatch(/finally\s*\{\s*deleteInFlight\.current = false;/);
  });
  it("prevents duplicate recurring previews and create requests", () => {
    const component = source("src/components/academics/college-recurring-preview.tsx");
    expect(component).toContain("if (pending || invalidRange || previewInFlight.current) return");
    expect(component).toContain("if (pending || executeInFlight.current) return");
    expect(component).toContain("previewInFlight.current = true");
    expect(component).toContain("previewInFlight.current = false");
    expect(component).toContain("executeInFlight.current = true");
    expect(component).toContain("executeInFlight.current = false");
  });
});


describe("UX-G125 shared academic mutation recovery", () => {
  it("locks create, program action and enrollment operations before the first await", () => {
    for (const file of [
      "src/components/academics/academics-create-panel.tsx",
      "src/components/academics/academics-actions.tsx",
      "src/components/academics/section-operations.tsx",
    ]) {
      const component = source(file);
      expect(component).toContain("if (pending || mutationInFlight.current) return");
      expect(component).toContain("mutationInFlight.current = true");
      expect(component).toContain("mutationInFlight.current = false");
      expect(component).toContain("academicSetupErrorMessage(error)");
    }
  });
  it("blocks invalid or repeated class-session writes while preserving retry", () => {
    const component=source("src/components/academics/college-section-management.tsx");
    expect(component).toContain("const scheduleWindowInvalid=Boolean(scheduleStart && scheduleEnd && scheduleEnd<=scheduleStart)");
    expect(component).toContain("scheduleInFlight.current=true");
    expect(component).toContain("scheduleInFlight.current=false");
    expect(component).toContain("disabled={scheduleLoading||pending||scheduleWindowInvalid}");
  });
});
