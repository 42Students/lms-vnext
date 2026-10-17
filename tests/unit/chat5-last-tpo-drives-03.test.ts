import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
  TPO_CLOSED_JOB_STATUSES,
  isTpoClosedJobStatus,
  projectTpoDriveLifecycle,
  tpoDriveStatusLabel,
  tpoDriveStatusTone,
  driveRequestStatusLabel,
} from "@/modules/placements/tpo-drive-lifecycle-list-model";

const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const base={
  title:"Software Engineer",company:"College Employer",workMode:"ONSITE",
  employmentType:"FULL_TIME",applicationDeadline:null,
};
const rows=[
  {...base,id:"closed",status:"CLOSED"},
  {...base,id:"cancelled",status:"CANCELLED"},
  {...base,id:"published",status:"PUBLISHED"},
  {...base,id:"draft",status:"DRAFT"},
  {...base,id:"archived",status:"ARCHIVED"},
];

describe("TPO-drives-03 corrected closed/cancelled lifecycle and recruiter request semantics",()=>{
  it("TPO-drives-03 Closed tab and count include CLOSED and CANCELLED once each, excluding other jobs",()=>{
    expect(TPO_CLOSED_JOB_STATUSES).toEqual(["CLOSED","CANCELLED"]);
    for(const s of ["CLOSED","CANCELLED"])expect(isTpoClosedJobStatus(s)).toBe(true);
    for(const s of ["ARCHIVED","DRAFT","PUBLISHED","REJECTED"])
      expect(isTpoClosedJobStatus(s)).toBe(false);
    const result=projectTpoDriveLifecycle(rows,"CLOSED","2099-01-01T00:00:00.000Z");
    expect(result.counts).toMatchObject({total:5,drafts:1,live:1,closed:2});
    expect(result.rows.map(row=>row.id)).toEqual(["cancelled","closed"]);
    expect(result.rows.some(row=>row.status==="REJECTED")).toBe(false);
  });
  it("TPO-drives-03 Cancelled and Closed retain distinct labels and tones; recruiter REJECTED is Declined in Requests, not a job status",()=>{
    expect(tpoDriveStatusLabel("CANCELLED")).toBe("Cancelled");
    expect(tpoDriveStatusTone("CANCELLED")).toBe("error");
    expect(tpoDriveStatusLabel("CLOSED")).toBe("Closed");
    expect(tpoDriveStatusTone("CLOSED")).toBe("neutral");
    expect(driveRequestStatusLabel("REJECTED")).toBe("Declined");
    const page=source("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
    expect(page).toContain("tpoDriveStatusLabel(job.status)");
    expect(page).toContain("tpoDriveStatusTone(job.status)");
    expect(page).toContain("driveRequestStatusLabel(item.status)");
    expect(page).toContain('["CLOSED","Closed",data.statusCounts.closed]');
  });
  it("TPO-drives-03 TPO cancel action persists CANCELLED transactionally with version guard, reason and audit, rather than converting to CLOSED",()=>{
    const cancel=source("src/modules/placements/tpo-drive-cancel-service.ts");
    expect(cancel).toMatch(/\.update\(placementJobs\)[\s\S]*?\.set\(\{\s*status: "CANCELLED"/);
    expect(cancel).toContain("eq(placementJobs.collegeId, collegeId)");
    expect(cancel).toContain("input.expectedUpdatedAt");
    expect(cancel).toContain('"PLACEMENTS_TPO_DRIVE_CANCELLED"');
    expect(cancel).toContain("reason: input.reason");
    expect(cancel).toContain("toStatus: saved.status");
    expect(cancel).not.toContain("CANCELLED job status\n    // requires a separate orchestrator-owned migration");
  });
  it("TPO-drives-03 service uses the identical status set for both counts, CLOSED view, and COMPLETE journey without widening tenant scope",()=>{
    const service=source("src/modules/placements/tpo-drive-lifecycle-list-service.ts");
    const match=service.match(/inArray\(placementJobs\.status,\[\.\.\.TPO_CLOSED_JOB_STATUSES\]\)/g)??[];
    expect(match).toHaveLength(4);
    expect(service).toContain("eq(placementJobs.collegeId,collegeId)");
    expect(service).toContain("isNull(placementJobs.archivedAt)");
    expect(service).toContain('selectedView==="CLOSED"?totals.closed:totals.total');
    expect(service).toContain('selectedView==="CLOSED"?');
    expect(service).toContain('inArray(placementRecruiterDriveRequests.status,["REQUEST","SENT_BACK","DRAFT","REJECTED","CANCELLED"])');
  });
});
