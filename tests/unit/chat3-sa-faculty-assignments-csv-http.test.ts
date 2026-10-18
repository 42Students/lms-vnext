import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const stubs = vi.hoisted(() => ({
  context: vi.fn(),
  list: vi.fn(),
  errors: vi.fn(),
}));
vi.mock("@/auth/request-context", () => ({
  getCurrentRequestContext: stubs.context,
}));
vi.mock("@/modules/admin-ui/super-admin-faculty-assignments-service", () => ({
  listAdminFacultyAssignments: stubs.list,
}));
vi.mock("@/lib/api-error", () => ({
  apiErrorResponse: stubs.errors,
}));
import {
  exportSuperAdminFacultyAssignments,
} from "@/modules/admin-ui/super-admin-faculty-assignments-csv-service";

const principal = { user: { id: "admin" }, adminScope: { collegeId: "college-a" } };
function request(query = "") {
  return new Request("https://lms.example/api/admin/faculty-assignments/csv" +
    (query ? "?" + query : ""), { method: "GET" });
}
const item = (name: string) => ({
  id: "faculty-1",
  title: name,
  subtitle: "Algorithms (CSE101)",
  details: [
    "Class: Section A",
    "Semester: Semester 1",
    "Year: 2099",
    "Teaching role: PRIMARY",
    "Active: Yes",
  ],
});
beforeEach(() => {
  vi.resetAllMocks();
  stubs.context.mockResolvedValue(principal);
  stubs.list.mockImplementation(async (
    _context: unknown, query: { page: number; pageSize: number },
  ) => ({
    total: 1,
    totalPages: 1,
    items: query.page === 1 ? [item("Faculty Example")] : [],
  }));
  stubs.errors.mockReturnValue(Response.json({
    error: "FORBIDDEN",
    message: "You do not have access to this export.",
    requestId: "safe",
  }, { status: 403 }));
});

describe("SA3-FAC-EXPORT-02 strict Super Admin Faculty assignment CSV", () => {
  it("rejects duplicated selectors, unexpected tenant filters and invalid statuses before fetching users", async () => {
    for (const search of [
      "status=ACTIVE&status=ENDED",
      "page=1&page=2",
      "q=a&q=b",
      "collegeId=forged",
      "status=REJECTED",
      "page=0",
    ]) {
      const response = await exportSuperAdminFacultyAssignments(request(search));
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "INVALID_ASSIGNMENT_FILTERS" });
    }
    expect(stubs.context).not.toHaveBeenCalled();
    expect(stubs.list).not.toHaveBeenCalled();
  });

  it("uses one authenticated server context and no-store CSV headers for a normal export", async () => {
    const response = await exportSuperAdminFacultyAssignments(
      request("status=ACTIVE&q=example"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-disposition")).toContain("faculty-assignments.csv");
    expect(stubs.context).toHaveBeenCalledOnce();
    expect(stubs.list).toHaveBeenCalledWith(principal, expect.objectContaining({
      status: "ACTIVE", q: "example", page: 1, pageSize: 100,
    }));
    const csv = await response.text();
    expect(csv).toContain("Faculty Example");
    expect(csv).toContain("Section A");
    expect(csv).toContain("Semester 1");
    expect(csv).not.toContain("email");
    expect(csv).not.toContain("phone");
  });

  it("caps at 300 persisted rows and discloses truncation rather than claiming a full export", async () => {
    stubs.list.mockImplementation(async (_context: unknown, input: { page: number }) => ({
      total: 305,
      totalPages: 4,
      items: Array.from({ length: 100 }, (_, n) => item("Faculty " + ((input.page - 1) * 100 + n))),
    }));
    const response = await exportSuperAdminFacultyAssignments(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("x-export-truncated")).toBe("true");
    const csv = await response.text();
    expect(csv).toContain("TRUNCATED: showing first 300 assignments");
    expect(csv).not.toContain("Faculty 300");
    expect(stubs.list).toHaveBeenCalledTimes(3);
  });

  it("keeps a failed permission or database read private through the canonical mapper", async () => {
    stubs.list.mockRejectedValueOnce(new Error("internal database credentials"));
    const response = await exportSuperAdminFacultyAssignments(request());
    expect(response.status).toBe(403);
    expect(stubs.errors).toHaveBeenCalledOnce();
    expect(JSON.stringify(await response.json())).not.toContain("credentials");
  });
});
