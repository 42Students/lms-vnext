import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LearnerCourseList, type LearnerCourseListRow } from "@/components/courses/learner-course-list";

const regular: LearnerCourseListRow = {
  course: {
    deliveryId: "regular",
    courseId: "course-regular",
    courseName: "Algebra",
    courseCode: "MTH101",
    courseDescription: "Fundamentals",
    offeringType: "CORE",
    credits: 4,
    sectionName: "A",
    sectionCode: "A",
    academicPeriodId: "term-1",
    academicPeriodName: "Semester 1",
    programName: "Engineering",
    programCode: "ENG",
    periodStartDate: "2026-01-01",
    periodEndDate: "2026-06-30",
  },
  instructorNames: ["Instructor"],
  summary: { overallPercent: 0, itemsCompleted: 0, itemsTotal: 1 },
  readOnly: false,
  learningPathReady: false,
  nextItem: null,
};

const elective: LearnerCourseListRow = {
  ...regular,
  course: {
    ...regular.course,
    deliveryId: "elective",
    courseId: "course-elective",
    courseName: "Music",
    courseCode: "MUS101",
    offeringType: "ELECTIVE",
  },
};

describe("learner Courses responsive layout", () => {
  it("keeps the Electives heading separate from the first elective card", () => {
    const html = renderToStaticMarkup(<LearnerCourseList rows={[regular, elective]} />);
    expect(html).toContain("col-span-full");
    expect(html).toContain(">Electives</h2>");
    expect(html).toContain('href="/learn/courses/elective/home"');
    expect(html).not.toContain("md:col-span-2 xl:col-span-3");
  });

  it("renders course-type filters as accessible pressed buttons", () => {
    const html = renderToStaticMarkup(<LearnerCourseList rows={[regular, elective]} />);
    expect(html).toContain('aria-label="Filter by course type"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("grid-cols-3");
  });
});
