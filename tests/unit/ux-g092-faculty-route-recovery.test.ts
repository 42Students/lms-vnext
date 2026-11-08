import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  facultyCourseHealthHref,
  facultyCourseHealthParamsSchema,
} from "@/modules/courses/faculty-course-health-model";

const deliveryId = "11111111-1111-4111-8111-111111111111";
const read = (relative: string) =>
  readFileSync(join(process.cwd(), relative), "utf8");

describe("UX-G092 Faculty course and contact recovery", () => {
  it("rejects duplicate report selectors rather than silently taking the first", () => {
    for (const query of [
      { deliveryId, kind: ["ALL", "QUIZ"] },
      { deliveryId, kind: ["QUIZ"] },
      { deliveryId, page: ["1", "2"] },
      { deliveryId, page: ["1"] },
    ]) {
      expect(facultyCourseHealthParamsSchema.safeParse(query).success).toBe(false);
    }
    expect(facultyCourseHealthParamsSchema.safeParse({
      deliveryId, kind: "QUIZ", page: "2",
    }).success).toBe(true);

    const source = read(
      "src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/page.tsx",
    );
    expect(source).toContain("kind:raw.kind ?? undefined");
    expect(source).toContain("page:raw.page ?? undefined");
    expect(source).not.toContain("first(raw.kind)");
    expect(source).not.toContain("first(raw.page)");
  });

  it("keeps a valid Section deep link while clearing invalid assessment filters", () => {
    const reset = facultyCourseHealthHref(
      facultyCourseHealthParamsSchema.parse({ deliveryId }),
    );
    expect(reset).toBe(
      `/teacher/courses/${deliveryId}/assessment-health`,
    );
    const source = read(
      "src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/page.tsx",
    );
    expect(source).toContain('title="Invalid Section report filters"');
    expect(source).toContain('validCourse?"Reset report filters":"Back to courses"');
    expect(source).toContain("facultyCourseHealthParamsSchema.safeParse({deliveryId})");
  });

  it("recovers a removed or foreign lesson link only after authorizing the teaching Section", () => {
    const source = read(
      "src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/page.tsx",
    );
    expect(source).toContain("getFacultyCourseWorkspace(context,deliveryId)");
    expect(source).toContain("!workspace.lessons.some(lesson=>lesson.id===requestedLesson)");
    expect(source).toContain('title="Lesson link unavailable"');
    expect(source).toContain("encodeURIComponent(deliveryId)+\"/assignments/manage\"");
    expect(source).toContain("Open Section assignments");
    expect(source.indexOf("getFacultyCourseWorkspace(context,deliveryId)"))
      .toBeLessThan(source.indexOf('title="Lesson link unavailable"'));
  });

  it("offers a real faculty-home escape from a failed courses directory", () => {
    const source = read("src/app/(authenticated)/teacher/courses/error.tsx");
    expect(source).toContain('href="/teacher" label="Faculty home"');
    expect(source).not.toContain('href="/teacher/courses" label="Back to Courses"');
    expect(source).toContain('type="button" onClick={reset}');
  });

  it("returns contact-detail failures only to a known directory tab", () => {
    const source = read(
      "src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/error.tsx",
    );
    expect(source).toContain('tab==="allContacts"||tab==="teachers"||tab==="students"');
    expect(source).toContain('safeTab?"/teacher/contacts/"+safeTab:"/teacher/contacts"');
    expect(source).toContain('href={backHref}');
    expect(source).toContain('type="button" onClick={reset}');
  });
});
