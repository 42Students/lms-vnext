import { describe, expect, it } from "vitest";
import { ownsOverlayHistoryEntry } from "@/components/ui/use-overlay-webview";

describe("RV-04 C-05 A2-02 overlay Back destination ownership", () => {
  it("a child B pop to parent A is owned by A, not by B", () => {
    const a="lms-overlay:a:1", b="lms-overlay:b:1";
    const destination={lmsOverlay:a};
    expect(ownsOverlayHistoryEntry(destination,a)).toBe(true);
    expect(ownsOverlayHistoryEntry(destination,b)).toBe(false);
  });
  it("a rapid unrelated route Back is NEVER swallowed by stale cleanup state", () => {
    const a="lms-overlay:a:1", b="lms-overlay:b:2";
    const routeDestination={route:"/learn/courses"};
    expect(ownsOverlayHistoryEntry(routeDestination,a)).toBe(false);
    expect(ownsOverlayHistoryEntry(routeDestination,b)).toBe(false);
    expect(ownsOverlayHistoryEntry(null,a)).toBe(false);
  });
  it("a reopened overlay has a distinct generation from the old history marker",()=>{
    expect(ownsOverlayHistoryEntry({lmsOverlay:"lms-overlay:a:1"},"lms-overlay:a:2")).toBe(false);
  });
});
