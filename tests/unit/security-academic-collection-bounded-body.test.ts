import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  origin: vi.fn(),
  context: vi.fn(),
  createPeriod: vi.fn(), createCohort: vi.fn(), createEnrollment: vi.fn(),
  createSection: vi.fn(), selectClass: vi.fn(), createSemester: vi.fn(),
  createSlot: vi.fn(), listSlotOptions: vi.fn(), createSchedule: vi.fn(),
  selectBatch: vi.fn(), createLegacyClass: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/auth/origin", () => ({ isSameOriginRequest: mocks.origin }));
vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: mocks.context }));
vi.mock("@/lib/api-error", () => ({
  apiErrorResponse: () => NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 }),
}));
vi.mock("@/modules/academics/period-service", () => ({
  createAcademicPeriod: mocks.createPeriod, listAcademicPeriods: vi.fn(),
}));
vi.mock("@/modules/academics/cohort-service", () => ({
  createCohort: mocks.createCohort, listCohorts: vi.fn(),
}));
vi.mock("@/modules/academics/enrollment-service", () => ({
  createLearnerProgramEnrollment: mocks.createEnrollment,
  listLearnerProgramEnrollments: vi.fn(),
}));
vi.mock("@/modules/academics/section-service", () => ({
  createSection: mocks.createSection, listSections: vi.fn(), searchSections: vi.fn(),
  listPopularClasses: vi.fn(), collegeClassNameExists: vi.fn(),
  recordClassSearchSelection: mocks.selectClass,
}));
vi.mock("@/modules/academics/college-academic-directory-service", () => ({
  listCollegeSemesters: vi.fn(), searchCollegeBatchAutocomplete: vi.fn(),
  recordCollegeBatchSearchSelection: mocks.selectBatch,
}));
vi.mock("@/modules/academics/semester-mutation-service", () => ({
  createCollegeSemester: mocks.createSemester,
  SemesterMutationError: class SemesterMutationError extends Error {},
}));
vi.mock("@/modules/electives/college-slot-mutation-service", () => ({
  createCollegeElectiveSlot: mocks.createSlot,
  listCollegeElectiveSlotOptions: mocks.listSlotOptions,
  CollegeElectiveSlotMutationError: class CollegeElectiveSlotMutationError extends Error {},
}));
vi.mock("@/modules/academics/schedule-service", () => ({
  createSectionScheduleEvent: mocks.createSchedule,
  listSectionScheduleEvents: vi.fn(),
}));
vi.mock("@/modules/academics/college-section-mutation-service", () => ({
  createCollegeSection: mocks.createLegacyClass,
  CollegeSectionError: class CollegeSectionError extends Error {},
}));

import { POST as period } from "@/app/api/academics/periods/route";
import { POST as cohort } from "@/app/api/academics/cohorts/route";
import { POST as enrollment } from "@/app/api/academics/enrollments/route";
import { POST as section } from "@/app/api/academics/sections/route";
import { POST as semester } from "@/app/api/academics/semesters/route";
import { POST as elective } from "@/app/api/academics/elective-slots/route";
import { POST as schedule } from "@/app/api/academics/schedule-events/route";
import { POST as batchSelection } from "@/app/api/academics/search/batches/route";
import { POST as legacyClass } from "@/app/api/v1/class/create/route";

const id = "11111111-1111-4111-8111-111111111111";
const id2 = "22222222-2222-4222-8222-222222222222";
const origin = "https://college.example.test";
const ctx = { user: { id: id2 } };
const oversize = JSON.stringify({ input: "x".repeat(16_385) });

const request = (path: string, body: string, method = "POST") => new Request(origin + path, {
  method,
  headers: {
    host: "college.example.test", origin, "content-type": "application/json",
  },
  body,
});
const mutations = () => [
  mocks.createPeriod, mocks.createCohort, mocks.createEnrollment,
  mocks.createSection, mocks.selectClass, mocks.createSemester, mocks.createSlot,
  mocks.createSchedule, mocks.selectBatch, mocks.createLegacyClass,
];
const cases: Array<{
  name: string; path: string; handler: (req: Request) => Promise<Response>;
  writer: ReturnType<typeof vi.fn>; valid: unknown; status: number;
}> = [
  {
    name: "academic period", path: "/api/academics/periods", handler: period,
    writer: mocks.createPeriod, status: 201,
    valid: { collegeId: id, name: "2026-27", code: "Y26", startDate: "2026-07-01", endDate: "2027-06-30" },
  },
  {
    name: "cohort", path: "/api/academics/cohorts", handler: cohort,
    writer: mocks.createCohort, status: 201,
    valid: { programId: id, startPeriodId: id2, name: "Batch A", code: "A" },
  },
  {
    name: "learner enrollment", path: "/api/academics/enrollments", handler: enrollment,
    writer: mocks.createEnrollment, status: 201,
    valid: { programId: id, cohortId: id2, membershipId: id },
  },
  {
    name: "section", path: "/api/academics/sections", handler: section,
    writer: mocks.createSection, status: 201,
    valid: { cohortId: id, academicPeriodId: id2, name: "Section A", code: "A" },
  },
  {
    name: "semester", path: "/api/academics/semesters", handler: semester,
    writer: mocks.createSemester, status: 201,
    valid: { programId: id, termNumber: 1, name: "Semester 1" },
  },
  {
    name: "elective slot", path: "/api/academics/elective-slots", handler: elective,
    writer: mocks.createSlot, status: 201,
    valid: { programId: id, academicPeriodId: id2, name: "Elective A" },
  },
  {
    name: "schedule event", path: "/api/academics/schedule-events", handler: schedule,
    writer: mocks.createSchedule, status: 201,
    valid: { sectionId: id, title: "Class A", startsAt: "2026-11-05T09:00:00+05:30",
      endsAt: "2026-11-05T10:00:00+05:30" },
  },
  {
    name: "batch search selection", path: "/api/academics/search/batches", handler: batchSelection,
    writer: mocks.selectBatch, status: 200,
    valid: { batchId: id },
  },
  {
    name: "legacy class creation", path: "/api/v1/class/create", handler: legacyClass,
    writer: mocks.createLegacyClass, status: 200,
    valid: { cohortId: id, name: "Class A", code: "A" },
  },
];
beforeEach(() => {
  vi.clearAllMocks();
  mocks.origin.mockReturnValue(true);
  mocks.context.mockResolvedValue(ctx);
  mocks.listSlotOptions.mockResolvedValue({ programs: [], periods: [] });
  mocks.createSlot.mockResolvedValue({ id, programId: id, academicPeriodId: id2 });
  for (const writer of mutations()) if (writer !== mocks.createSlot) writer.mockResolvedValue({ id });
});

describe("academic collection POST routes: shared streamed 16 KiB JSON cap", () => {
  it.each(cases)("rejects oversized $name without any domain mutation", async spec => {
    const req = request(spec.path, oversize);
    // A lying Content-Length must not override the actual byte count.
    req.headers.set("content-length", "1");
    const response = await spec.handler(req);
    expect(response.status).toBe(413);
    expect(response.headers.get("cache-control")).toContain("no-store");
    for (const writer of mutations()) expect(writer).not.toHaveBeenCalled();
  });

  it.each(cases)("rejects malformed $name JSON without any mutation", async spec => {
    const response = await spec.handler(request(spec.path, "{"));
    expect(response.status).toBe(400);
    for (const writer of mutations()) expect(writer).not.toHaveBeenCalled();
  });

  it.each(cases)("preserves valid $name request service routing", async spec => {
    const response = await spec.handler(request(spec.path, JSON.stringify(spec.valid)));
    expect(response.status).toBe(spec.status);
    expect(spec.writer).toHaveBeenCalledOnce();
  });

  it.each(cases)("blocks cross-site $name before parsing or any write", async spec => {
    mocks.origin.mockReturnValue(false);
    const response = await spec.handler(request(spec.path, JSON.stringify(spec.valid)));
    expect(response.status).toBe(403);
    expect(mocks.context).not.toHaveBeenCalled();
    for (const writer of mutations()) expect(writer).not.toHaveBeenCalled();
  });

  it("continues accepting the typed SELECT event in section discovery", async () => {
    const response = await section(request("/api/academics/sections",
      JSON.stringify({ action: "SELECT", sectionId: id, idempotencyKey: id2 })));
    expect(response.status).toBe(200);
    expect(mocks.selectClass).toHaveBeenCalledWith(ctx, id, id2);
    expect(mocks.createSection).not.toHaveBeenCalled();
  });

  it("continues rejecting invalid UTF-8 before an enrollment write", async () => {
    const invalid = new Request(origin + "/api/academics/enrollments", {
      method: "POST", body: new Uint8Array([0xff, 0xfe]),
      headers: { host: "college.example.test", origin, "content-type": "application/json" },
    });
    const response = await enrollment(invalid);
    expect(response.status).toBe(400);
    for (const writer of mutations()) expect(writer).not.toHaveBeenCalled();
  });
});
