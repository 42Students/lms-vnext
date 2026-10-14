import { describe, expect, it } from "vitest";
import { filterFacultyAssessments } from "@/modules/courses/faculty-assessment-filter";

const sample = [
  {
    id: "a", deliveryId: "section-A", status: "DRAFT",
    title: "Week 1 Algebra", description: "Linear regression",
    courseCode: "MTH101", courseName: "Mathematics",
    sectionName: "Section A", lessonName: "Vectors",
  },
  {
    id: "b", deliveryId: "section-B", status: "PUBLISHED",
    title: "Physics Lab", description: null,
    courseCode: "PHY201", courseName: "Physics",
    sectionName: "Section B", lessonName: "Circuits",
  },
] as const;

describe("Faculty assessment aggregate filter", () => {
  it("searches title, description, section and lesson case-insensitively", () => {
    expect(filterFacultyAssessments(sample, { search: "  linear " }).map(x => x.id)).toEqual(["a"]);
    expect(filterFacultyAssessments(sample, { search: "CIRCUITS" }).map(x => x.id)).toEqual(["b"]);
    expect(filterFacultyAssessments(sample, { search: "PHY201" }).map(x => x.id)).toEqual(["b"]);
    expect(filterFacultyAssessments(sample, { search: "nothing" })).toEqual([]);
  });

  it("requires all selected filters to match in the authorized input", () => {
    expect(filterFacultyAssessments(sample, {
      deliveryId: "section-A", status: "DRAFT", search: "algebra",
    }).map(x => x.id)).toEqual(["a"]);
    expect(filterFacultyAssessments(sample, {
      deliveryId: "section-B", status: "DRAFT", search: "algebra",
    })).toEqual([]);
    expect(filterFacultyAssessments(sample, {})).toHaveLength(2);
    expect(sample).toHaveLength(2);
  });
});
