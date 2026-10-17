import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {evaluateTpoDriveCancellation,type TpoDriveCancelImpact} from "@/modules/placements/tpo-drive-cancel-model";
const zeros:TpoDriveCancelImpact={submittedApplications:0,openRounds:0,issuedOffers:0,acceptedOffers:0};
const source=(path:string)=>readFileSync(path,"utf8");
describe("TPO drive draft cancellation parity",()=>{
 it("TPO-drive-workspace-R06 can cancel drafts with audited preview while published drives respect season",()=>{
  expect(evaluateTpoDriveCancellation("DRAFT",null,zeros,zeros)).toBe("ALLOW");
  expect(evaluateTpoDriveCancellation("DRAFT","CLOSED",zeros,zeros)).toBe("ALLOW");
  expect(evaluateTpoDriveCancellation("PUBLISHED","CLOSED",zeros,zeros)).toBe("READ_ONLY");
  expect(evaluateTpoDriveCancellation("PUBLISHED","ACTIVE",zeros,zeros)).toBe("ALLOW");
  expect(evaluateTpoDriveCancellation("CANCELLED","ACTIVE",zeros,zeros)).toBe("READ_ONLY");
  expect(evaluateTpoDriveCancellation("DRAFT",null,{...zeros,submittedApplications:1},zeros)).toBe("PREVIEW_STALE");
  const service=source("src/modules/placements/tpo-drive-cancel-service.ts");
  expect(service).toContain('job.status === "DRAFT" ||');
  expect(service).toContain('inArray(placementJobs.status, ["DRAFT", "PUBLISHED"])');
  expect(service).toContain("await auditTpoJobChange(");
  expect(service).toContain("await endDriveApplicants(");
  const page=source("src/components/placements/placement-drive-workspace.tsx");
  expect(page).toContain('job.status === "DRAFT" || job.status === "PUBLISHED"');
  expect(source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/cancel-preview/page.tsx"))
   .toContain("Cancellation is available for drafts or published drives");
 });
});
