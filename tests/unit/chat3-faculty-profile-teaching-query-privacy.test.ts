import { describe, expect, it } from "vitest";
import {
  facultyProfileTeachingQuerySchema, ownFacultyTeachingHref, pageOwnFacultyTeaching,
} from "@/modules/courses/faculty-profile-teaching-model";
const deliveryA = "11111111-1111-4111-8111-111111111111";
const row = (id: number) => ({
  deliveryId: deliveryA + id,
  courseCode: "CS-" + id,
  courseName: "Algorithms",
  sectionName: "Class " + id,
  academicPeriodName: "Semester 1",
  academicPeriodStatus: "ACTIVE", teachingRole: "PRIMARY",
});
describe("FAC-PROFILE-TEACHING-01 owned-teaching summary navigation", () => {
  it("does not coerce malicious repeated, exponent, array, boolean or foreign college selectors", () => {
    expect(facultyProfileTeachingQuerySchema.parse({})).toEqual({ search: "", page: 1 });
    for (const query of [
      { page: ["1"] }, { page: true }, { page: "1e3" }, { page: "001" },
      { page: 0 }, { page: -1 }, { page: "Infinity" }, { page: 10001 },
      { search: "a".repeat(121) }, { search: "A", collegeId: deliveryA },
    ]) {
      expect(facultyProfileTeachingQuerySchema.safeParse(query).success).toBe(false);
    }
  });

  it("searches only the already-authorized records, clamps vanished deep-link pages and avoids mutation", () => {
    const entries = Array.from({ length: 42 }, (_, index) => row(index));
    const snapshot = [...entries];
    const unfiltered = pageOwnFacultyTeaching(entries, facultyProfileTeachingQuerySchema.parse({ page: 99 }));
    expect(unfiltered).toMatchObject({ total: 42, page: 3, totalPages: 3 });
    expect(unfiltered.items).toHaveLength(2);
    const narrowed = pageOwnFacultyTeaching(entries, facultyProfileTeachingQuerySchema.parse({
      search: "CS-10", page: 3,
    }));
    expect(narrowed).toMatchObject({ total: 1, page: 1, totalPages: 1 });
    expect(narrowed.items[0]?.courseCode).toBe("CS-10");
    expect(entries).toEqual(snapshot);
  });

  it("encodes search term without leaking an independently selectable tenant", () => {
    const query = facultyProfileTeachingQuerySchema.parse({ search: "  A&B  ", page: "2" });
    const uri = new URL(ownFacultyTeachingHref(query), "https://example.org");
    expect(uri.pathname).toBe("/teacher/profile/teaching");
    expect(uri.searchParams.get("search")).toBe("A&B");
    expect(uri.searchParams.get("page")).toBe("2");
    expect(uri.searchParams.has("collegeId")).toBe(false);
    expect(ownFacultyTeachingHref(facultyProfileTeachingQuerySchema.parse({})))
      .toBe("/teacher/profile/teaching");
  });
});
