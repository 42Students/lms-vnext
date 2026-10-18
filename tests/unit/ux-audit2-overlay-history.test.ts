import { describe, expect, it } from "vitest";
import { consumeOverlayCleanupPop, queueOverlayCleanupPop } from "@/components/ui/use-overlay-webview";

describe("UX-AUDIT2 A2-02 nested overlay cleanup semantics", () => {
  it("explicitly closing child B consumes its own popstate once, not parent A", () => {
    queueOverlayCleanupPop();
    const event = new Event("popstate");
    // Each overlay has a listener. Every listener must ignore the SAME cleanup event.
    expect(consumeOverlayCleanupPop(event)).toBe(true);
    expect(consumeOverlayCleanupPop(event)).toBe(true);
    // The next real Back is not swallowed: it can close parent A.
    expect(consumeOverlayCleanupPop(new Event("popstate"))).toBe(false);
  });
  it("two explicit nested cleanups each own one history event", () => {
    queueOverlayCleanupPop();
    queueOverlayCleanupPop();
    expect(consumeOverlayCleanupPop(new Event("popstate"))).toBe(true);
    expect(consumeOverlayCleanupPop(new Event("popstate"))).toBe(true);
    expect(consumeOverlayCleanupPop(new Event("popstate"))).toBe(false);
  });
});
