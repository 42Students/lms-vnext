import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");

describe("chat-6 cross-page gap source verification", () => {
  it("SA-academics-people-68 filters course progress by course and batch with legacy completion guidance", () => {
    const page = source("src/app/(authenticated)/admin/course-progress/page.tsx");
    const fields = source("src/components/courses/super-admin-course-progress-selector.tsx");
    expect(page).toContain("SuperAdminCourseProgressSelector");
    expect(page).toContain("parseSuperAdminCourseProgressParams");
    expect(page).toContain("{...(data.query.courseCode !== undefined ? {selectedCourse:data.query.courseCode} : {})}");
    expect(page).toContain("{...(data.query.cohortCode !== undefined ? {selectedCohort:data.query.cohortCode} : {})}");
    expect(page).toContain("Progress counts videos watched to the end, assignments submitted and quizzes attempted.");
    expect(page).toContain("Resources are not counted, because they are marked done by the student");
    expect(fields).toContain('name="courseCode"');
    expect(fields).toContain('name="cohortCode"');
  });

  it("COL-placements-20 provides drive-scoped interview scheduling, statuses and calendar download", () => {
    const page = source("src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx");
    const appointments = source("src/components/placements/college-interview-appointments.tsx");
    expect(page).toContain("listCollegeDriveInterviews(context,jobId,query)");
    expect(page).toContain("getCollegeRoundSlotAppointments(context,jobId,{");
    expect(page).toContain("<CollegeInterviewAppointments");
    // The appointment owns the authorized filename; its ICS URL is now
    // assembled once and reused in desktop and narrow layouts.
    expect(appointments).toContain('const eventIcsHref=(row:Appointment)=>"data:text/calendar;charset=utf-8,"');
    expect(appointments).toContain("href={eventIcsHref(row)}");
    expect(appointments).toContain("download={\"interview-\"+row.id+\".ics\"}");
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
    expect(actions).toContain('onClick={()=>setPendingAction("ARCHIVE")}');
    expect(actions).toContain("apiFetch");
    expect(actions).not.toContain("data?.error");
  });

  it("COL-placements-26 exposes a persisted Hired count and Mark Hired action without inferring joining", () => {
    const overview = source("src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx");
    const pipeline = source("src/components/placements/college-application-pipeline-controls.tsx");
    const funnel = source("src/modules/placements/college-hiring-funnel-service.ts");
    expect(overview).toContain("funnel?.cumulativeTotals.HIRED");
    expect(overview).toContain("getCollegeHiringFunnel(context,{jobId})");
    expect(overview).toContain("No missing selection data is inferred.");
    expect(pipeline).toContain('stage==="HIRED"?"Mark Hired"');
    expect(funnel).toContain('"HIRED"');
  });

  it("SA-academics-people-72 guards unsaved resource changes and uses legacy resource confirmations", () => {
    const actions = source("src/components/courses/super-admin-content-actions.tsx");
    expect(actions).toContain("Discard the changes to this resource? Unsaved links and material changes will be lost.");
    expect(actions).toContain("Delete this resource?");
    expect(actions).toContain("Students will no longer see it. The record and private files are retained");
    expect(actions).toContain("Resource updated");
    expect(actions).toContain("Resource deleted");
  });

  it("SA-academics-people-79 renders selected-college faculty and student overview metrics from scoped directory counts", () => {
    const page=source("src/components/admin/admin-scoped-read-page.tsx");
    const faculty=source("src/app/(authenticated)/admin/faculty/page.tsx");
    const students=source("src/app/(authenticated)/admin/students/page.tsx");
    expect(page).toContain('const summaries=directoryKind?await Promise.allSettled([');
    expect(page).toContain('status:"ALL"');
    expect(page).toContain('status:"ACTIVE"');
    expect(page).toContain('status:"SUSPENDED"');
    expect(page).toContain('label:"Visible now"');
    expect(page).toContain('heading(directoryKind?"People"');
    expect(faculty).toContain('kind: "FACULTY" as const');
    expect(students).toContain('kind:"LEARNER" as const');
  });
});
