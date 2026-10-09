import { describe, expect, it } from "vitest";
import { safeNotificationActionHref } from "@/modules/activity/notification-action";

describe("DB10 notification internal navigation", () => {
  it("accepts ordinary same-origin app paths, including query strings", () => {
    expect(safeNotificationActionHref("/learn/placements")).toBe("/learn/placements");
    expect(safeNotificationActionHref("/courses?tab=quiz")).toBe("/courses?tab=quiz");
  });

  it("fails closed for unknown, cross-origin, protocol-relative and malformed links", () => {
    for (const unsafe of [
      null,
      undefined,
      "",
      "https://evil.example/x",
      "javascript:alert(1)",
      "//evil.example/x",
      "/\\evil.example/x",
      "/safe\nunsafe",
      "/safe\runsafe",
      "/safe\u0000unsafe",
      " /learn/placements",
      "/" + "x".repeat(1001),
    ]) {
      expect(safeNotificationActionHref(unsafe)).toBeNull();
    }
  });
});
