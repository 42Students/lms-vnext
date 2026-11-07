import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  origin: vi.fn(), context: vi.fn(),
  periodUpdate: vi.fn(), periodTransition: vi.fn(),
  cohortUpdate: vi.fn(), cohortTransition: vi.fn(),
  sectionUpdate: vi.fn(), sectionArchive: vi.fn(),
  enrollmentTransition: vi.fn(),
  sectionAssign: vi.fn(), roster: vi.fn(), history: vi.fn(),
  legacyClassUpdate: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/auth/origin", () => ({ isSameOriginRequest: mocks.origin }));
vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: mocks.context }));
vi.mock("@/lib/api-error", () => ({
  apiErrorResponse: () => NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 }),
}));
vi.mock("@/modules/academics/college-period-lifecycle-service", () => ({
  CollegePeriodLifecycleError: class CollegePeriodLifecycleError extends Error {},
}));
vi.mock("@/modules/academics/period-service", () => ({
  updateAcademicPeriod: mocks.periodUpdate, transitionAcademicPeriod: mocks.periodTransition,
}));
vi.mock("@/modules/academics/cohort-service", () => ({
  updateCohort: mocks.cohortUpdate, transitionCohort: mocks.cohortTransition,
}));
vi.mock("@/modules/academics/section-service", () => ({
  updateSection: mocks.sectionUpdate, archiveSection: mocks.sectionArchive,
}));
vi.mock("@/modules/academics/enrollment-service", () => ({
  transitionLearnerProgramEnrollment: mocks.enrollmentTransition,
}));
vi.mock("@/modules/academics/roster-service", () => ({
  assignLearnerToSection: mocks.sectionAssign,
  listSectionRoster: mocks.roster, listLearnerSectionHistory: mocks.history,
}));
vi.mock("@/modules/academics/college-section-mutation-service", () => ({
  updateCollegeSection: mocks.legacyClassUpdate,
  CollegeSectionError: class CollegeSectionError extends Error {},
}));

import { PATCH as period } from "@/app/api/academics/periods/[periodId]/route";
import { PATCH as cohort } from "@/app/api/academics/cohorts/[cohortId]/route";
import { PATCH as section } from "@/app/api/academics/sections/[sectionId]/route";
import { PATCH as enrollment } from "@/app/api/academics/enrollments/[enrollmentId]/route";
import { GET as sectionRead, POST as sectionAssign } from "@/app/api/academics/section-enrollments/route";
import { PUT as legacyClass } from "@/app/api/v1/class/update/[sectionId]/route";

const id = "11111111-1111-4111-8111-111111111111";
const id2 = "22222222-2222-4222-8222-222222222222";
const base = "https://college.example.test";
const ctx = { user: { id: id2 } };
const tooLarge = JSON.stringify({ action: "x".repeat(16_385) });
const make = (method: string, path: string, body: string) => new Request(base + path, {
  method,
  headers: { host: "college.example.test", origin: base, "content-type": "application/json" },
  body,
});
const argsPeriod = { params: Promise.resolve({ periodId: id }) };
const argsCohort = { params: Promise.resolve({ cohortId: id }) };
const argsSection = { params: Promise.resolve({ sectionId: id }) };
const argsEnrollment = { params: Promise.resolve({ enrollmentId: id }) };

const allWriters = () => [
  mocks.periodUpdate, mocks.periodTransition,
  mocks.cohortUpdate, mocks.cohortTransition,
  mocks.sectionUpdate, mocks.sectionArchive,
  mocks.enrollmentTransition, mocks.sectionAssign, mocks.legacyClassUpdate,
];

const cases: Array<{
  name: string; path: string; method: string; body: unknown;
  handler: (request: Request) => Promise<Response>; writer: ReturnType<typeof vi.fn>;
}> = [
  { name: "period edit", path: "/api/academics/periods/" + id,
    method: "PATCH", body: { name: "Updated" },
    handler: req => period(req, argsPeriod), writer: mocks.periodUpdate },
  { name: "cohort edit", path: "/api/academics/cohorts/" + id,
    method: "PATCH", body: { name: "Updated" },
    handler: req => cohort(req, argsCohort), writer: mocks.cohortUpdate },
  { name: "section edit", path: "/api/academics/sections/" + id,
    method: "PATCH", body: { name: "Updated" },
    handler: req => section(req, argsSection), writer: mocks.sectionUpdate },
  { name: "learner enrollment transition", path: "/api/academics/enrollments/" + id,
    method: "PATCH", body: { action: "COMPLETE" },
    handler: req => enrollment(req, argsEnrollment), writer: mocks.enrollmentTransition },
  { name: "section roster assignment", path: "/api/academics/section-enrollments",
    method: "POST", body: { learnerEnrollmentId: id, sectionId: id2 },
    handler: sectionAssign, writer: mocks.sectionAssign },
  { name: "legacy class update", path: "/api/v1/class/update/" + id,
    method: "PUT", body: { name: "Updated" },
    handler: req => legacyClass(req, argsSection), writer: mocks.legacyClassUpdate },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.origin.mockReturnValue(true);
  mocks.context.mockResolvedValue(ctx);
  for (const writer of allWriters()) writer.mockResolvedValue({ id });
  mocks.roster.mockResolvedValue([]);
  mocks.history.mockResolvedValue([]);
});

describe("academic detail write API byte limits", () => {
  it.each(cases)("denies oversized $name without a service mutation", async item => {
    const request = make(item.method, item.path, tooLarge);
    request.headers.set("content-length", "2");
    const response = await item.handler(request);
    expect(response.status).toBe(413);
    expect(response.headers.get("cache-control")).toContain("no-store");
    for (const writer of allWriters()) expect(writer).not.toHaveBeenCalled();
  });

  it.each(cases)("denies malformed $name without a service mutation", async item => {
    const response = await item.handler(make(item.method, item.path, "{"));
    expect(response.status).toBe(400);
    for (const writer of allWriters()) expect(writer).not.toHaveBeenCalled();
  });

  it.each(cases)("preserves a valid $name mutation", async item => {
    const response = await item.handler(make(item.method, item.path, JSON.stringify(item.body)));
    expect(response.status).toBe(item.name === "section roster assignment" ? 201 : 200);
    expect(item.writer).toHaveBeenCalledOnce();
    expect(item.writer).toHaveBeenCalledWith(ctx, ...(item.name === "section roster assignment"
      ? [item.body] : [id, item.body]));
  });

  it.each(cases)("blocks cross-origin $name before side effects", async item => {
    mocks.origin.mockReturnValue(false);
    const response = await item.handler(make(item.method, item.path, JSON.stringify(item.body)));
    expect(response.status).toBe(403);
    expect(mocks.context).not.toHaveBeenCalled();
    for (const writer of allWriters()) expect(writer).not.toHaveBeenCalled();
  });

  it("preserves period transition action dispatch", async () => {
    const response = await period(make("PATCH", "/api/academics/periods/" + id,
      JSON.stringify({ action: "ACTIVATE" })), argsPeriod);
    expect(response.status).toBe(200);
    expect(mocks.periodTransition).toHaveBeenCalledOnce();
    expect(mocks.periodUpdate).not.toHaveBeenCalled();
  });

  it("preserves cohort transition action dispatch", async () => {
    const response = await cohort(make("PATCH", "/api/academics/cohorts/" + id,
      JSON.stringify({ action: "ACTIVATE" })), argsCohort);
    expect(response.status).toBe(200);
    expect(mocks.cohortTransition).toHaveBeenCalledOnce();
    expect(mocks.cohortUpdate).not.toHaveBeenCalled();
  });
});

describe("section enrollment GET resource selector isolation", () => {
  it.each([
    "?sectionId=" + id + "&sectionId=" + id2,
    "?learnerEnrollmentId=" + id + "&learnerEnrollmentId=" + id2,
    "?sectionId=" + id + "&learnerEnrollmentId=" + id2,
  ])("rejects ambiguous %s without querying either private data source", async params => {
    const response = await sectionRead(new Request(base + "/api/academics/section-enrollments" + params));
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(mocks.roster).not.toHaveBeenCalled();
    expect(mocks.history).not.toHaveBeenCalled();
  });

  it("preserves a single section-roster selector", async () => {
    const response = await sectionRead(new Request(base + "/api/academics/section-enrollments?sectionId=" + id));
    expect(response.status).toBe(200);
    expect(mocks.roster).toHaveBeenCalledWith(ctx, id);
    expect(mocks.history).not.toHaveBeenCalled();
  });

  it("preserves a single learner-history selector", async () => {
    const response = await sectionRead(new Request(base + "/api/academics/section-enrollments?learnerEnrollmentId=" + id));
    expect(response.status).toBe(200);
    expect(mocks.history).toHaveBeenCalledWith(ctx, id);
    expect(mocks.roster).not.toHaveBeenCalled();
  });
});

// The route wrapper now names its permission; these tests use bare fake actors and exercise handler logic, so the
// permission policy (covered by its own tests) is bypassed here.
vi.mock("@/modules/permissions/policy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/permissions/policy")>()),
  requirePermission: () => undefined,
  requireActorPermission: () => undefined,
}));
