import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const file = (name: string) => readFileSync("src/components/tpo/" + name + ".tsx", "utf8");
const ui = (name: string) => readFileSync("src/components/ui/" + name + ".tsx", "utf8");

describe("UX-tpo-overlay: focus-safe mobile and desktop workflows", () => {
  it("UX-tpo-overlay-01 student panel uses Drawer focus isolation and sticky next/previous actions", () => {
    const source = file("tpo-student-quick-panel");
    expect(source).toContain("<Drawer open={true} onOpenChange=");
    expect(source).toContain('title={"Student panel for "+student.displayName}');
    expect(source).toContain("footer={");
    expect(source).toContain("onNavigate(rows[index-1].membershipId)");
    expect(source).toContain("onNavigate(rows[index+1].membershipId)");
    expect(source).toContain("grid-cols-1 gap-3 sm:grid-cols-2");
    expect(source).toContain("Retry loading student details");
    expect(source).not.toContain('role="dialog"');
  });
  it("UX-tpo-overlay-02 notice composer uses native shared modal behavior", () => {
    const source = file("tpo-notice-composer-dialog");
    expect(source).toContain("<Dialog open={open} onOpenChange={setOpen} title={title}>");
    expect(source).toContain("Edit announcement");
    expect(source).toContain("New announcement");
    expect(source).not.toContain("<dialog ref=");
  });
  it("UX-tpo-overlay-03 mobile More menu traps focus and dismisses by Escape/backdrop", () => {
    const source = file("tpo-mobile-footer");
    expect(source).toContain('<BottomSheet open={moreOpen} onOpenChange={setMoreOpen} title="More TPO workspaces"');
    expect(source).toContain("aria-expanded={moreOpen}");
    expect(source).toContain("onClick={()=>setMoreOpen(false)}");
    expect(source).toContain("min-h-11");
    expect(source).not.toContain('role="dialog"');
  });
  it("UX-tpo-overlay-04 company creation preserves required fields, explicit review and safe errors", () => {
    const source = file("tpo-company-create-form");
    expect(source).toContain('<Dialog open={open} onOpenChange={next=>{if(!next)close();}}');
    expect(source).toContain("form.name.trim().length < 2");
    expect(source).toContain("confirmed: true");
    expect(source).toContain("Confirm company creation");
    expect(source).toContain('role="alert"');
    expect(source).not.toContain("body?.error ??");
    expect(source).not.toContain('role="dialog"');
  });
  it("UX-tpo-overlay-05 bell opens a named Drawer and exposes retry paths", () => {
    const source = file("tpo-bell-panel");
    expect(source).toContain("<Drawer open={open} onOpenChange={changeOpen}");
    expect(source).toContain('description="Most recent notifications from your own college."');
    expect(source).toContain("setRefreshing(true)");
    expect(source).toContain('role="alert"');
  });
  it("UX-tpo-overlay primitive contracts isolate focus, lock background and restore opener", () => {
    for (const name of ["dialog", "drawer", "bottom-sheet"]) {
      const source = ui(name);
      expect(source).toContain("modal.showModal()");
      expect(source).toContain("modal.close()");
      expect(source).toContain("opener.current?.focus()");
      expect(source).toContain("aria-labelledby={titleId}");
      expect(source).toContain("onCancel={event =>");
      expect(source).toContain("onClick={event =>");
      expect(source).toContain("<ScrollCue");
    }
  });
});
