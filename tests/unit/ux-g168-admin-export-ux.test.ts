import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  faculty: vi.fn(),
  apiError: vi.fn(),
}));
vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: mocks.context }));
vi.mock("@/modules/admin-ui/super-admin-faculty-assignments-service", () => ({
  listAdminFacultyAssignments: mocks.faculty,
}));
vi.mock("@/lib/api-error", () => ({ apiErrorResponse: mocks.apiError }));

import { superAdminBatchRosterCsv } from "@/modules/admin-ui/super-admin-batch-roster-export-model";
import {
  parseSuperAdminScopedCsvParams, superAdminScopedCsvHref,
} from "@/modules/admin-ui/super-admin-scoped-csv-model";
import { superAdminReadQuerySchema } from "@/modules/admin-ui/super-admin-read-directory-model";
import { exportSuperAdminFacultyAssignments } from "@/modules/admin-ui/super-admin-faculty-assignments-csv-service";
import { exportSuperAdminLearningDirectory } from "@/modules/admin-ui/super-admin-learning-csv-service";

const actor = {
  user: { id:"11111111-1111-4111-8111-111111111111",identityUid:"admin",systemRoles:["SUPER_ADMIN"],platformStatus:"ACTIVE" },
  adminScope: { collegeId:"22222222-2222-4222-8222-222222222222",organizationId:"33333333-3333-4333-8333-333333333333" },
  membership: null,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.context.mockResolvedValue(actor);
  mocks.apiError.mockReturnValue(new Response("Unavailable",{status:503}));
});

describe("UX-G168 readable and safe privileged CSV exports", () => {
  it("exports Unicode campus names safely instead of executing hidden spreadsheet formulas", () => {
    const text=superAdminBatchRosterCsv([{
      name:"\u0301=HYPERLINK(\"https://evil.invalid\")",
      roll:"\u2060@SUM(1,1)",
      email:"learner@example.test",
      classId:"a",
    }],new Map([["a","\u200b+1+1"]]));
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain("'\u0301=HYPERLINK");
    expect(text).toContain("'\u2060@SUM");
    expect(text).toContain("'\u200b+1+1");
    expect(text).toContain('""https://evil.invalid""');
    expect(text.endsWith("\r\n")).toBe(true);
  });

  it("keeps internal export filter links and rejects external, encoded, or backslash URLs", () => {
    const q=superAdminReadQuerySchema.parse({q:"Algebra",status:"ACTIVE",page:4,pageSize:100});
    const safe=superAdminScopedCsvHref("/api/admin/students/export",q);
    expect(safe).toContain("q=Algebra");
    expect(safe).toContain("status=ACTIVE");
    expect(safe).not.toContain("pageSize");
    expect(safe).not.toContain("page=");
    for(const url of ["https://evil.invalid/export","//evil.invalid/file","/%2f%2fevil.invalid","/\\evil.invalid", " /api/admin/students/export"]) {
      expect(()=>superAdminScopedCsvHref(url,q)).toThrow("Unsafe CSV export destination");
    }
  });

  it("rejects duplicated export filters, retaining one authoritative scope", () => {
    expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("q=one&q=two"))).toThrow();
  });

  it("gives the 7-column faculty CSV a properly aligned truncated-results row", async () => {
    mocks.faculty.mockImplementation(async (_:unknown,q:{page:number})=>({
      total:301,totalPages:4,
      items:Array.from({length:100},(_,i)=>({
        title:"Faculty "+(q.page*100+i),
        subtitle:"Programming",
        details:["Class: A","Semester: 1","Year: 2099","Teaching role: PRIMARY","Active: Yes"],
      })),
    }));
    const response=await exportSuperAdminFacultyAssignments(new Request("https://lms.invalid/api/admin/faculty-assignment/export"));
    expect(response.status).toBe(200);
    const lines=(await response.text()).split("\r\n").filter(Boolean);
    expect(lines).toHaveLength(302);
    expect(lines.at(-1)).toContain("TRUNCATED: showing first 300 assignments");
    expect((lines.at(-1)?.match(/"/g)??[]).toHaveLength(14);
    expect(response.headers.get("X-Export-Truncated")).toBe("true");
  });

  it("gives the 13-column learning CSV a properly aligned truncated-results row", async () => {
    const reader=async (_:unknown,__:unknown,q:{page:number})=>({
      total:501,totalPages:21,
      items:Array.from({length:25},(_,i)=>({
        id:"quiz-"+q.page+"-"+i,title:"Quiz",courseName:"Algorithms",courseCode:"CSE101",lessonName:"Unit",
        status:"PUBLISHED",dueAt:null,points:10,activityCount:2,eligibleLearners:50,
        submittedLearners:32,gradedLearners:20,resultsPublished:false,
      })),
    });
    const response=await exportSuperAdminLearningDirectory(
      new Request("https://lms.invalid/api/admin/quizzes/export"),"QUIZ",
      reader as unknown as Parameters<typeof exportSuperAdminLearningDirectory>[2],
    );
    expect(response.status).toBe(200);
    const lines=(await response.text()).split("\r\n").filter(Boolean);
    expect(lines).toHaveLength(502);
    expect(lines.at(-1)).toContain("TRUNCATED: first 500 records");
    expect((lines.at(-1)?.match(/"/g)??[]).toHaveLength(26);
    expect(response.headers.get("X-Export-Truncated")).toBe("true");
  });
});
