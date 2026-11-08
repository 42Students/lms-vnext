import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { friendlyApiError, FRIENDLY_MESSAGES } from "@/lib/friendly-error";

const source = (path: string) => readFileSync(path, "utf8");

describe("UX-G134 college mutation confirmation safety", () => {
  it("locks bulk faculty creation from confirmation until all receipts finish", () => {
    const file=source("src/components/college/college-faculty-assignment-actions.tsx");
    expect(file).toContain("if(saving||savingRef.current)return");
    expect(file).toContain("savingRef.current=true");
    expect(file).toContain("savingRef.current=false;setSaving(false)");
    expect(file).toContain("if(saving||endingRef.current)return");
    expect(file).toContain("endingRef.current=false;");
    expect(file).toContain("for(const id of facultyIds)");
    expect(file).toContain("failedSelections.push(id)");
  });
  it("keeps student registration locked while the confirm dialog is open", () => {
    const file=source("src/components/college/college-student-register-form.tsx");
    expect(file).toContain("if(pending||registrationInFlight.current)return;");
    expect(file).toContain("registrationInFlight.current=true;");
    expect(file).toContain("registrationInFlight.current=false;");
    expect(file).toContain("await guardedRun(async()=>");
    expect(file).toContain("Check the student roster before retrying.");
    expect(file).toContain("sectionId:sectionId||undefined");
  });
  it("locks a college profile-card save before updating React pending state", () => {
    const file=source("src/components/college/college-admin-profile-editor.tsx");
    expect(file).toContain("if(saving||saveInFlight.current||readOnly)return");
    expect(file).toContain("saveInFlight.current=true");
    expect(file).toContain("saveInFlight.current=false");
    expect(file).toContain("baseline,changedSections:savingSections");
  });
});

describe("UX-G134 privacy-safe denied/error recovery", () => {
  it("maps permission, missing, stale and service errors to safe user copy", () => {
    expect(friendlyApiError({status:403,code:"PRIVATE_SERVER_REASON"})).toBe(FRIENDLY_MESSAGES.forbidden);
    expect(friendlyApiError({status:404,code:"PRIVATE_SERVER_REASON"})).toBe(FRIENDLY_MESSAGES.missing);
    expect(friendlyApiError({status:409,code:"PRIVATE_SERVER_REASON"})).toBe(FRIENDLY_MESSAGES.conflict);
    expect(friendlyApiError({status:500,code:"PROVIDER_STACK_TRACE"})).toBe(FRIENDLY_MESSAGES.unexpected);
  });
  it("does not render raw backend error codes in college person dialogs", () => {
    for(const path of [
      "src/components/college/college-person-audit-modal.tsx",
      "src/components/college/college-person-profile-overview-modal.tsx",
    ]) {
      const file=source(path);
      expect(file).toContain("friendlyApiError({");
      expect(file).toContain("typeof ");
      expect(file).toContain("requestId.current");
      expect(file).not.toMatch(/throw Error\((?:body|payload)\?\.error/);
    }
  });
  it("sanitizes all three faculty/offering editing error paths", () => {
    for(const path of [
      "src/components/college/college-faculty-reassign-action.tsx",
      "src/components/college/college-faculty-schedule-reassign.tsx",
      "src/components/college/college-offering-metadata-action.tsx",
    ]) {
      const file=source(path);
      expect(file).toContain("friendlyApiError({status:");
      expect(file).toContain("encodeURIComponent(");
      expect(file).not.toMatch(/throw (?:new )?Error\((?:body|payload)\?\.error/);
    }
  });
});
