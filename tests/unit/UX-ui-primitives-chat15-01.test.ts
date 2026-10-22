import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const ui = (name: string) => readFileSync(join(process.cwd(), "src/components/ui", name), "utf8");

describe("UX-ui-primitives-chat15-01 direct contracts", () => {
  it("UX-ui-bottom-sheet-01 traps background interaction, returns focus and cues overflow", () => {
    const s = ui("bottom-sheet.tsx");
    const overlay=ui("use-overlay-exit.ts");
    for(const term of ["dialog.showModal()", "dialog.close()", "opener.focus()"])
      expect(overlay).toContain(term);
    for(const term of ["useOverlayExit(ref, opener, open, 180)",
      "aria-labelledby={titleId}", "event.target === ref.current && dismissible",
      "onCancel={event", 'axis="y"', "sheet content", "safe-area-inset-bottom"]) {
      expect(s).toContain(term);
    }
  });
  it("UX-ui-loading-state-01 names its skeleton and does not leave a blank screen", () => {
    const s=ui("loading-state.tsx");
    expect(s).toContain('label = "Loading workspace…"');
    expect(s).toContain('data-slot="loading-state"');
    expect(s).toContain("<Skeleton label={label}");
    expect(s).toContain('variant="line"');
    expect(s).toContain("count={3}");
  });
  it("UX-ui-selection-controls-01 uses labelled native controls, 44px targets and reduced motion", () => {
    const s=ui("selection-controls.tsx");
    expect(s).toContain('<NativeCheckbox {...props}');
    expect(s).toContain('<NativeRadio {...props}');
    expect(s).toContain('role="switch"');
    expect(s).toContain('"radio"');
    expect(s).toContain("min-h-11");
    expect(s).toContain("focus-visible:outline-2");
    expect(s).toContain("has-[:disabled]:text-[var(--lms-neutral-400)]");
    expect(s).toContain("motion-reduce:transition-none");
    expect(s).toContain("duration-[var(--lms-motion-fast)]");
  });
  it("UX-ui-confirm-flow-01 cancels superseded/unmounted asks and supports Escape cancellation", () => {
    const s=ui("use-confirm-flow.tsx");
    expect(s).toContain("resolver.current?.(false)");
    expect(s).toContain("resolver.current = null");
    expect(s).toContain("onOpenChange={open => { if (!open) finish(false); }}");
    expect(s).toContain("onConfirm={() => finish(true)}");
    expect(s).toContain("setMessage(null)");
  });
});
