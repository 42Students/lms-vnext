import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");

describe("chat-6 cross-page gap source verification", () => {
  it("SA-academics-people-68 filters course progress by course and batch with legacy completion guidance", () => {
    const page = source("src/app/(authenticated)/admin/course-progress/page.tsx");
    const fields = source("src/components/admin/super-admin-learning-filter-fields.tsx");
    expect(page).toContain("SuperAdminLearningFilterFields");
    expect(page).toContain("courseCode:raw.courseCode");
    expect(page).toContain("cohortCode:raw.cohortCode");
    expect(page).toContain("Progress counts videos watched to the end, assignments submitted and quizzes attempted.");
    expect(page).toContain("Resources are not counted toward completion.");
    expect(fields).toContain('name="courseCode"');
    expect(fields).toContain('name="cohortCode"');
  });

  it("COL-placements-20 provides drive-scoped interview scheduling, statuses and calendar download", () => {
    const page = source("src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx");
    const appointments = source("src/components/placements/college-interview-appointments.tsx");
    expect(page).toContain("listCollegeDriveInterviews(context,jobId,query)");
    expect(page).toContain("getCollegeRoundSlotAppointments(context,jobId)");
    expect(page).toContain("<CollegeInterviewAppointments");
    expect(appointments).toContain('href={"data:text/calendar;charset=utf-8,"');
    expect(appointments).toContain("collegeInterviewIcs");
    expect(appointments).toContain('action:"CANCEL"|"COMPLETED"|"NO_SHOW"');
    expect(appointments).toContain("Schedule interview");
  });

  it("SA-academics-people-58 retains in-page link-based content authoring and safely explains blocked binary uploads", () => {
    const page = source("src/components/courses/super-admin-content-directory-page.tsx");
    const create = source("src/components/courses/super-admin-content-authoring.tsx");
    const actions = source("src/components/courses/super-admin-content-actions.tsx");
    expect(page).toContain("<SuperAdminContentAuthoring");
    expect(page).toContain("<SuperAdminContentActions");
    expect(create).toContain('VIDEOS:["YOUTUBE"]');
    expect(create).toContain('LIVE_CLASSES:["LIVE_CLASS"]');
    expect(create).toContain('RESOURCES:["RESOURCE"]');
    expect(create).toContain("private");
    expect(actions).toContain("apiFetch");
    expect(actions).not.toContain("data?.error");
  });

  it("SA-academics-people-72 shows resource editing and archive confirmation without raw API errors", () => {
    const actions = source("src/components/courses/super-admin-content-actions.tsx");
    expect(actions).toContain('item.contentType==="RESOURCE"');
    expect(actions).toContain('transition("ARCHIVE")');
    expect(actions).toContain("apiFetch");
    expect(actions).not.toContain("data?.error");
  });
});
