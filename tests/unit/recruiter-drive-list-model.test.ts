import { describe, expect, it } from "vitest";
import { filterRecruiterDrives, recruiterDriveListQuerySchema, summarizeRecruiterDrives, sortRecruiterDrives, isHrDriveDeadlineToday } from "@/modules/placements/recruiter-drive-list-model";
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
  it("shows mixed published and waiting work by default, like the current prototype",async()=>{
    const {recruiterDefaultDriveView}=await import("@/modules/placements/recruiter-drive-list-model");
    expect(recruiterDefaultDriveView({live:1,waiting:1})).toBe("ALL");
    expect(recruiterDefaultDriveView({live:1,waiting:0})).toBe("LIVE");
    expect(recruiterDefaultDriveView({live:0,waiting:1})).toBe("WAITING");
    expect(recruiterDefaultDriveView({live:0,waiting:0})).toBe("ALL");
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
  it("filters the deadline calendar day in IST and past timestamps without changing job status",()=>{
    const now=new Date("2026-10-14T20:00:00Z");
    const dueToday=new Date("2026-10-14T19:50:00Z");
    expect(isHrDriveDeadlineToday(dueToday,now)).toBe(true);
    expect(isHrDriveDeadlineToday(new Date("2026-10-14T18:00:00Z"),
      new Date("2026-10-14T18:20:00Z"))).toBe(true);
    const jobs=[{collegeId:id,job:{
      id:"today",title:"Support",status:"PUBLISHED",archivedAt:null,applicationDeadline:dueToday,
    }},{collegeId:id,job:{
      id:"future",title:"Engineer",status:"PUBLISHED",archivedAt:null,
      applicationDeadline:new Date("2026-10-16T18:00:00Z"),
    }}];
    expect(filterRecruiterDrives(jobs,recruiterDriveListQuerySchema.parse({
      collegeId:id,deadline:"TODAY",
    }),now).map(row=>row.job.id)).toEqual(["today"]);
    expect(filterRecruiterDrives(jobs,recruiterDriveListQuerySchema.parse({
      collegeId:id,deadline:"PAST",
    }),now).map(row=>row.job.id)).toEqual(["today"]);
    expect(recruiterDriveListQuerySchema.safeParse({deadline:"TOMORROW"}).success).toBe(false);
  });

});
