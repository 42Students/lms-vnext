import { describe, expect, it } from "vitest";
import { filterRecruiterDrives, recruiterDriveListQuerySchema, summarizeRecruiterDrives, sortRecruiterDrives } from "@/modules/placements/recruiter-drive-list-model";
const id = "00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000002";
const rows = [
  { collegeId: id, job: { id: "a", title: "Frontend Engineer", status: "PUBLISHED", archivedAt: null }},
  { collegeId: id, job: { id: "b", title: "Backend Engineer", status: "CLOSED", archivedAt: null }},
  { collegeId: other, job: { id: "c", title: "Frontend Engineer", status: "PUBLISHED", archivedAt: null }},
  { collegeId: id, job: { id: "d", title: "Frontend Engineer", status: "DRAFT", archivedAt: null }},
  { collegeId: id, job: { id: "e", title: "Frontend Engineer", status: "PUBLISHED", archivedAt: new Date() }},
];
describe("HR drive lifecycle filters", () => {
  it("only returns visible authorized college jobs", () => {
    const query = recruiterDriveListQuerySchema.parse({ collegeId: id, view: "LIVE", q: "FRONT" });
    expect(filterRecruiterDrives(rows, query).map(row => row.job.id)).toEqual(["a"]);
  });
  it("does not fabricate waiting requests", () => {
    expect(summarizeRecruiterDrives(rows)).toEqual({all: 3, live: 2, closed: 1, waiting: 0});
    expect(filterRecruiterDrives(rows, recruiterDriveListQuerySchema.parse({view: "WAITING"}))).toEqual([]);
  });
  it("denies unbounded / unknown filter values", () => {
    expect(recruiterDriveListQuerySchema.safeParse({q: "a".repeat(101)}).success).toBe(false);
    expect(recruiterDriveListQuerySchema.safeParse({view: "DRAFT"}).success).toBe(false);
    expect(recruiterDriveListQuerySchema.safeParse({sort:"FOREIGN"}).success).toBe(false);
    const safe=filterRecruiterDrives(rows,recruiterDriveListQuerySchema.parse({collegeId:id}));
    expect(sortRecruiterDrives(safe,"TITLE").map(row=>row.job.id)).toEqual(["b","a"]);
    expect(rows[0]!.job.id).toBe("a");
    expect(recruiterDriveListQuerySchema.safeParse({collegeId:"not-a-uuid"}).success).toBe(false);
  });
});
