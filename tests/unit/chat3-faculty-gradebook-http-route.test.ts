import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { facultyPublishedGradeRows } from "@/modules/courses/faculty-gradebook-model";

const stubs = vi.hoisted(() => ({
  context: vi.fn(),
  gradebook: vi.fn(),
  apiError: vi.fn(),
}));
vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: stubs.context }));
vi.mock("@/modules/courses/faculty-gradebook-service", () => ({
  getFacultyPublishedGradebook: stubs.gradebook,
}));
vi.mock("@/lib/api-error", () => ({ apiErrorResponse: stubs.apiError }));

import { GET } from "@/app/api/courses/faculty/gradebook/[deliveryId]/csv/route";

const deliveryId = "11111111-1111-4111-8111-111111111111";
const url = "https://college.example/api/courses/faculty/gradebook/" + deliveryId + "/csv";
const get = (id: string = deliveryId) =>
  GET(new Request(url, { method: "GET" }), { params: Promise.resolve({ deliveryId: id }) });

beforeEach(() => {
  vi.resetAllMocks();
  stubs.context.mockResolvedValue({ user: { id: "authorized-faculty" } });
  stubs.gradebook.mockResolvedValue({
    rows: facultyPublishedGradeRows([
      { membershipId: "a", displayName: "=HYPERLINK(1)", email: "private@example.test", rollNumber: "1" },
      { membershipId: "b", displayName: "Learner B", email: "also-private@example.test", rollNumber: "2" },
    ], [
      { membershipId: "a", earned: 8, possible: 10, kind: "ASSIGNMENT", assessmentId: "q" },
    ], 1),
  });
  stubs.apiError.mockReturnValue(NextResponse.json({
    error: "FORBIDDEN",
    message: "You do not have permission to view this report.",
    requestId: "safe-id",
  }, { status: 403 }));
});

describe("FAC-GRADE-HTTP-01 Faculty published gradebook CSV endpoint", () => {
  it("returns a BOM, safe formula values and published Section grades, never learner email/PII", async () => {
    const response = await get();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain("faculty-section-gradebook.csv");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    const csv = await response.text();
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("\"'=HYPERLINK(1)\"");
    expect(csv).toContain("Incomplete grading");
    expect(csv).toContain("\"80\"");
    expect(csv).not.toContain("private@example.test");
    expect(csv).not.toContain("also-private@example.test");
    expect(stubs.gradebook).toHaveBeenCalledWith({ user: { id: "authorized-faculty" } }, { deliveryId });
  });

  it("rejects invalid delivery identifiers before resolving context or generating CSV", async () => {
    const response = await get("not-a-uuid");
    expect(response.status).toBe(403);
    expect(stubs.context).not.toHaveBeenCalled();
    expect(stubs.gradebook).not.toHaveBeenCalled();
    expect(stubs.apiError).toHaveBeenCalledOnce();
  });

  it("honors service permission denial rather than disclosing cached CSV", async () => {
    stubs.gradebook.mockRejectedValue(new Error("forbidden"));
    const response = await get();
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: "FORBIDDEN", requestId: "safe-id" });
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(stubs.apiError).toHaveBeenCalledTimes(1);
  });

  it("keeps the 500-learner limit with a truthful truncation notice for authorized reports", async () => {
    const large = Array.from({ length: 502 }, (_, index) => ({
      membershipId: String(index), displayName: "Student " + index, email: null, rollNumber: String(index),
    }));
    stubs.gradebook.mockResolvedValue({ rows: facultyPublishedGradeRows(large, [], 0) });
    const response = await get();
    const csv = await response.text();
    expect(response.status).toBe(200);
    expect(csv).toContain("Export capped at 500 learners; 2 additional rows omitted");
    expect(csv).not.toContain("\"Student 501\"");
  });
});
