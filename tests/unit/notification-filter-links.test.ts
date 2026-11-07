import { describe, expect, it } from "vitest";
import { notificationFilterHref } from "@/modules/activity/notification-filter-links";

describe("notification inbox filter navigation UX", () => {
  it("keeps search and class/course scope when switching All/Unread", () => {
    expect(notificationFilterHref({
      baseHref: "/notifications",
      view: "unread",
      category: "PROJECTS",
      preservedParams: {
        q: "final & review",
        classId: "class-1",
        courseId: "course-2",
      },
    })).toBe(
      "/notifications?view=unread&category=PROJECTS&q=final+%26+review&classId=class-1&courseId=course-2",
    );
  });

  it("keeps query/scope when switching categories, and clears only the category", () => {
    expect(notificationFilterHref({
      baseHref: "/notifications",
      view: "all",
      category: "all",
      preservedParams: { q: "offer", classId: "class-1" },
    })).toBe("/notifications?view=all&q=offer&classId=class-1");
  });

  it("does not re-use an old pagination cursor when a filter changes", () => {
    const href = notificationFilterHref({
      baseHref: "/notifications",
      view: "unread",
      preservedParams: { q: "meeting" },
    });
    expect(href).toBe("/notifications?view=unread&q=meeting");
    expect(href).not.toContain("beforeId");
    expect(href).not.toContain("beforeCreatedAt");
  });

  it("retains existing role-specific tab links with no extra filters", () => {
    expect(notificationFilterHref({
      baseHref: "/mentor/notifications",
      view: "all",
      category: "college",
      categoryParam: "tab",
    })).toBe("/mentor/notifications?view=all&tab=college");
  });

  it("does not add blank preserved fields", () => {
    expect(notificationFilterHref({
      baseHref: "/notifications",
      view: "all",
      preservedParams: { q: "", classId: "", courseId: "" },
    })).toBe("/notifications?view=all");
  });
});
