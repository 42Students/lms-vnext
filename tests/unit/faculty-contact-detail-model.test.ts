import { describe, expect, it } from "vitest";
import {CoursesServiceError} from "@/modules/courses/errors";
import {
  facultyContactDetailHref,
  facultyContactDetailParamsSchema,
  facultyContactRoleLabel,
  facultyContactTabMatches,facultyContactDirectoryQuery,facultyContactDetailHidden,
} from "@/modules/courses/faculty-contact-detail-model";

const id = "40000000-0000-4000-8000-000000000004";

describe("Faculty contact detail model", () => {
  it("recognizes persisted college roles and directory tabs", () => {
    expect(facultyContactRoleLabel("LEARNER")).toBe("Student");
    expect(facultyContactRoleLabel("COLLEGE_ADMIN")).toBe("College Admin");
    expect(facultyContactRoleLabel("FACULTY")).toBe("Faculty");
    expect(facultyContactTabMatches("teachers", ["FACULTY", "MENTOR"])).toBe(true);
    expect(facultyContactTabMatches("students", ["FACULTY"])).toBe(false);
    expect(facultyContactTabMatches("allContacts", [])).toBe(true);
  });
  it("validates strict identifiers and tab names", () => {
    expect(facultyContactDetailParamsSchema.safeParse({
      contactsTab: "students", membershipId: id,
    }).success).toBe(true);
    expect(facultyContactDetailParamsSchema.safeParse({
      contactsTab: "staff", membershipId: id,
    }).success).toBe(false);
    expect(facultyContactDetailParamsSchema.safeParse({
      contactsTab: "students", membershipId: id, collegeId: id,
    }).success).toBe(false);
    expect(facultyContactDetailParamsSchema.safeParse({
      contactsTab: "students", membershipId: "not-a-uuid",
    }).success).toBe(false);
  });
  it("hides unavailable or cross-college contacts but propagates system errors",()=>{
    expect(facultyContactDetailHidden(new CoursesServiceError("MEMBERSHIP_NOT_FOUND"))).toBe(true);
    expect(facultyContactDetailHidden(new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED"))).toBe(true);
    expect(facultyContactDetailHidden(new Error("Database offline"))).toBe(false);
  });
  it("preserves only validated directory filters in public detail back links",()=>{
    expect(facultyContactDirectoryQuery({q:" C++ ",page:"2",pageSize:"20"}))
      .toBe("?q=C%2B%2B&page=2&pageSize=20");
    expect(facultyContactDirectoryQuery({})).toBe("");
    expect(facultyContactDirectoryQuery({collegeId:id})).toBe("");
    expect(facultyContactDirectoryQuery({page:["1","2"]})).toBe("");
  });
  it("keeps only validated IDs in detail links", () => {
    expect(facultyContactDetailHref("students", id))
      .toBe("/teacher/contacts/students/" + id);
  });
});
