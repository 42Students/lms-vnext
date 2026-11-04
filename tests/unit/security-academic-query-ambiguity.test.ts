import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  context: vi.fn(), periods: vi.fn(), cohorts: vi.fn(),
  enrollments: vi.fn(), schedules: vi.fn(), batches: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: mocks.context }));
vi.mock("@/lib/api-error", () => ({
  apiErrorResponse: () => NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 }),
}));
vi.mock("@/modules/academics/period-service", () => ({
  listAcademicPeriods: mocks.periods, createAcademicPeriod: vi.fn(),
}));
vi.mock("@/modules/academics/cohort-service", () => ({
  listCohorts: mocks.cohorts, createCohort: vi.fn(),
}));
vi.mock("@/modules/academics/enrollment-service", () => ({
  listLearnerProgramEnrollments: mocks.enrollments,
  createLearnerProgramEnrollment: vi.fn(),
}));
vi.mock("@/modules/academics/schedule-service", () => ({
  listSectionScheduleEvents: mocks.schedules, createSectionScheduleEvent: vi.fn(),
}));
vi.mock("@/modules/academics/college-academic-directory-service", () => ({
  searchCollegeBatchAutocomplete: mocks.batches,
  recordCollegeBatchSearchSelection: vi.fn(),
}));
import { GET as periods } from "@/app/api/academics/periods/route";
import { GET as cohorts } from "@/app/api/academics/cohorts/route";
import { GET as enrollments } from "@/app/api/academics/enrollments/route";
import { GET as schedules } from "@/app/api/academics/schedule-events/route";
import { GET as batches } from "@/app/api/academics/search/batches/route";

const id = "11111111-1111-4111-8111-111111111111";
const id2 = "22222222-2222-4222-8222-222222222222";
const root = "https://college.example.test";
const cases: Array<{
  name: string; path: string; duplicate: string; valid: string;
  handler: (request: Request) => Promise<Response>;
  service: ReturnType<typeof vi.fn>;
}> = [
  { name: "academic-period college scope", path: "/api/academics/periods",
    duplicate: "?collegeId=" + id + "&collegeId=" + id2,
    valid: "?collegeId=" + id, handler: periods, service: mocks.periods },
  { name: "cohort program scope", path: "/api/academics/cohorts",
    duplicate: "?programId=" + id + "&programId=" + id2,
    valid: "?programId=" + id, handler: cohorts, service: mocks.cohorts },
  { name: "enrollment cohort scope", path: "/api/academics/enrollments",
    duplicate: "?programId=" + id + "&cohortId=" + id + "&cohortId=" + id2,
    valid: "?programId=" + id + "&cohortId=" + id2, handler: enrollments,
    service: mocks.enrollments },
  { name: "schedule section scope", path: "/api/academics/schedule-events",
    duplicate: "?sectionId=" + id + "&sectionId=" + id2,
    valid: "?sectionId=" + id, handler: schedules, service: mocks.schedules },
  { name: "batch-search filters", path: "/api/academics/search/batches",
    duplicate: "?q=first&q=second", valid: "?q=first&limit=10",
    handler: batches, service: mocks.batches },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.context.mockResolvedValue({ user: { id } });
  for (const service of cases.map(item => item.service)) service.mockResolvedValue([]);
});

describe("academic scope selector ambiguity", () => {
  it.each(cases)("rejects duplicate $name without calling its query", async item => {
    const response = await item.handler(new Request(root + item.path + item.duplicate));
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(item.service).not.toHaveBeenCalled();
  });

  it.each(cases)("retains legitimate single $name selectors", async item => {
    const response = await item.handler(new Request(root + item.path + item.valid));
    expect(response.status).toBe(200);
    expect(item.service).toHaveBeenCalledOnce();
  });
});
