import { describe, expect, it } from "vitest";
import { cx } from "@/lib/class-names";

describe("cx", () => {
  it("keeps unrelated classes and drops falsy values", () => {
    expect(cx("flex gap-2", false, null, undefined, "items-center")).toBe("flex gap-2 items-center");
  });
  it("lets the later class win instead of needing !important", () => {
    expect(cx("px-4 min-h-9 text-sm", "px-3 text-xs")).toBe("min-h-9 px-3 text-xs");
    expect(cx("bg-[color:var(--lms-surface)]", "bg-transparent")).toBe("bg-transparent");
  });
  it("treats size and color text utilities as different groups", () => {
    expect(cx("text-sm", "text-[color:var(--lms-heading)]")).toBe("text-sm text-[color:var(--lms-heading)]");
  });
  it("keeps the shared focus and shadow token utilities", () => {
    expect(cx("focus-ring", "shadow-(--lms-elevation-2)")).toBe("focus-ring shadow-(--lms-elevation-2)");
    expect(cx("shadow-(--lms-elevation-1)", "shadow-(--lms-elevation-3)")).toBe("shadow-(--lms-elevation-3)");
  });
  it("keeps a length-hinted font size next to a text color (the unhinted var form is merged away)", () => {
    expect(cx("text-[length:var(--lms-font-base)] font-normal", "text-[var(--lms-form-ink)]")).toBe("text-[length:var(--lms-font-base)] font-normal text-[var(--lms-form-ink)]");
    expect(cx("text-[var(--lms-font-base)]", "text-[var(--lms-form-ink)]")).toBe("text-[var(--lms-form-ink)]");
  });
});
