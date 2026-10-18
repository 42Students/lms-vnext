import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");

describe("Final sprint recruiter applicant review accessibility", () => {
  it("REC-home-drives-R05 traps focus in the native Drawer and closes with Escape before restoring the opener", () => {
    const page = source("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx");
    const review = source("src/components/hr/recruiter-applicant-review-drawer.tsx");
    const drawer = source("src/components/ui/drawer.tsx");
    const overlay = source("src/components/ui/use-overlay-webview.ts");

    // The authorized URL-selected applicant uses the shared native Drawer,
    // not the deleted hand-built role=dialog and manual Tab focus cycling.
    expect(page).toContain("<RecruiterApplicantReviewDrawer");
    expect(page).toContain("focusedNavigation?.previous");
    expect(page).toContain("focusedNavigation?.next");
    expect(review).toContain('import { Drawer } from "@/components/ui/drawer"');
    expect(review).toContain("<Drawer open");
    expect(review).toContain('dismissible historyMode="route"');
    expect(review).toContain("if (!next) router.replace(closeHref)");

    // HTMLDialogElement.showModal() makes the browser confine Tab/Shift+Tab
    // to the active modal; focus restoration occurs on both close paths.
    expect(drawer).toContain("useRef<HTMLDialogElement>(null)");
    expect(drawer).toContain('<dialog ref={ref} data-slot="drawer"');
    expect(drawer).toContain("aria-labelledby={titleId}");
    expect(drawer).toContain("modal.showModal()");
    expect(drawer).toContain("opener.current = document.activeElement");
    expect(drawer).toContain("modal.close(); opener.current?.focus()");
    expect(drawer).toContain("onClose={() => { if (open) onOpenChange(false); opener.current?.focus(); }}");

    // Browser Escape cancels the modal; native-app Back dismisses the same
    // route-owned Drawer without creating an extra overlay-history marker.
    expect(drawer).toContain("onCancel={event => { event.preventDefault(); if (dismissible) onOpenChange(false); }}");
    expect(drawer).toContain('aria-label="Close drawer"');
    expect(overlay).toContain('window.addEventListener("lms:native-back", hostBack)');
    expect(overlay).toContain('if (historyMode === "route") return');
    expect(overlay).toContain("if (dismissibleRef.current) callback.current()");
  });

  it("REC-home-drives-R05 keeps next and previous applicant shortcuts inside the selected native dialog", () => {
    const shortcuts = source("src/components/placements/recruiter-focused-review-shortcuts.tsx");
    const page = source("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx");
    expect(page).toContain("<RecruiterFocusedReviewShortcuts");
    expect(page).toContain("focusedNavigation?.previous");
    expect(page).toContain("focusedNavigation?.next");
    expect(shortcuts).toContain('document.querySelectorAll<HTMLDialogElement>("dialog[open]")');
    expect(shortcuts).toContain("modal.contains(document.activeElement)");
    expect(shortcuts).toContain('e.key.toLowerCase() === "n" && nextHref');
    expect(shortcuts).toContain('e.key.toLowerCase() === "p" && previousHref');
    expect(shortcuts).toContain("router.push(nextHref)");
    expect(shortcuts).toContain("router.push(previousHref)");
    expect(shortcuts).not.toContain('document.getElementById("recruiter-focused-review-dialog")');
  });
});
