import { describe, expect, it } from "vitest";
import { facultyNotificationActionHref } from "@/modules/courses/faculty-notification-link-model";

describe("Faculty inbox navigation scope", () => {
  it("keeps legitimate teacher/course deep links and query cursors", () => {
    expect(facultyNotificationActionHref("/teacher/courses/abc/home?from=inbox")).toBe(
      "/teacher/courses/abc/home?from=inbox",
    );
    expect(facultyNotificationActionHref("/teach/courses")).toBe("/teach/courses");
    expect(facultyNotificationActionHref("/teacher/notifications#recent")).toBe("/teacher/notifications#recent");
  });
  it("blocks external protocols, protocol-relative and cross-role destinations", () => {
    for (const input of ["https://attacker.test", "//attacker.test", "javascript:alert(1)",
      "/learn/profile", "/mentor/projects", "/teacher-other/home",
      "/teacher\\evil", "/teacher\n/dashboard"]) {
      expect(facultyNotificationActionHref(input)).toBeNull();
    }
    expect(facultyNotificationActionHref(null)).toBeNull();
  });
});
