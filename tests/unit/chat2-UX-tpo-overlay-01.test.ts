import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const file = (name: string) => readFileSync("src/components/tpo/" + name + ".tsx", "utf8");
const ui = (name: string) => readFileSync("src/components/ui/" + name + (name === "use-overlay-exit" ? ".ts" : ".tsx"), "utf8");

describe("UX-tpo-overlay: focus-safe mobile and desktop workflows", () => {
  it("UX-tpo-overlay-01 student panel uses Drawer focus isolation and sticky next/previous actions", () => {
    const source = file("tpo-student-quick-panel");
    expect(source).toContain("<Drawer open={true} onOpenChange=");
    expect(source).toContain('title={student.displayName+" · "+(student.rollNumber');
    expect(source).toContain("footer={");
    expect(source).toContain("if(previous)onNavigate(previous.membershipId)");
    expect(source).toContain("if(next)onNavigate(next.membershipId)");
    expect(source).toContain("grid-cols-2 gap-2 sm:grid-cols-[1fr_auto_1fr]");
    expect(source).toContain('onClick={()=>void fetchDetail()}>Retry</Button>');
    expect(source).not.toContain('role="dialog"');
  });
  it("UX-tpo-overlay-02 notice composer uses native shared modal behavior", () => {
    const source = file("tpo-notice-composer-dialog");
    expect(source).toContain("<Dialog open={open} onOpenChange={setOpen} title={title}");
    expect(source).toContain("Edit announcement");
    expect(source).toContain("New announcement");
    expect(source).not.toContain("<dialog ref=");
  });
  it("UX-tpo-overlay-03 mobile More links to the canonical, keyboard-accessible workspace page", () => {
    const source = file("tpo-mobile-footer");
    expect(source).toContain('href:"/tpo/more"');
    expect(source).toContain('<nav aria-label="TPO mobile footer"');
    expect(source).toContain('aria-current={active ? "page" : undefined}');
    expect(source).toContain('focus-visible:outline-2');
    expect(source).toContain('min-h-16');
    expect(source).not.toContain('role="dialog"');
    expect(source).not.toContain("window.open");
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
    expect(source).toContain('<Drawer id="tpo-notification-drawer" open={open} onOpenChange={changeOpen}');
    expect(source).toContain('description="Most recent notifications from your own college."');
    expect(source).toContain("setRefreshing(true)");
    expect(source).toContain('role="alert"');
  });
  it("UX-tpo-overlay primitive contracts share focus restoration, top-layer dismissal and reduced-motion exit", () => {
    const lifecycle = ui("use-overlay-exit");
    expect(lifecycle).toContain("dialog.showModal()");
    expect(lifecycle).toContain("dialog.close()");
    expect(lifecycle).toContain("opener?.isConnected");
    expect(lifecycle).toContain("opener.focus()");
    expect(lifecycle).toContain("prefers-reduced-motion: reduce");
    for (const name of ["dialog", "drawer", "bottom-sheet"]) {
      const source = ui(name);
      expect(source).toContain("useOverlayExit(ref, opener, open,");
      expect(source).toContain("aria-labelledby={titleId}");
      expect(source).toContain("onCancel={event =>");
      expect(source).toContain("onClick={event =>");
      expect(source).toContain("<ScrollCue");
    }
  });
});
