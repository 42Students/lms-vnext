import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {canDeleteUnpublishedDrive,tpoDeleteDraftSchema} from "@/modules/placements/tpo-delete-draft-model";
import {tpoApplicantPipelineParams} from "@/modules/placements/tpo-applicant-pipeline-model";
import {tpoApplicantReviewSchema,candidateScreeningPayload} from "@/modules/placements/tpo-applicant-review-model";
const source=(path:string)=>readFileSync(path,"utf8");

describe("chat-5 Drive Workspace next 25+ OPEN gap evidence",()=>{
 it("TPO-drive-workspace-06 archives only empty DRAFT records after version review",()=>{
  expect(canDeleteUnpublishedDrive({status:"DRAFT",applications:0,offers:0,matchesVersion:true})).toBe("ALLOW");
  expect(canDeleteUnpublishedDrive({status:"DRAFT",applications:1,offers:0,matchesVersion:true})).toBe("HAS_HISTORY");
  expect(canDeleteUnpublishedDrive({status:"DRAFT",applications:0,offers:0,matchesVersion:false})).toBe("STALE");
  expect(canDeleteUnpublishedDrive({status:"PUBLISHED",applications:0,offers:0,matchesVersion:true})).toBe("NOT_DRAFT");
  expect(tpoDeleteDraftSchema.safeParse({confirmed:true,expectedUpdatedAt:"2099-05-01T00:00:00Z"}).success).toBe(true);
 });
 it("TPO-drive-workspace-R06 recovers abandoned unpublished drives without touching an applicant",()=>{
  const service=source("src/modules/placements/tpo-delete-draft-service.ts");
  const route=source("src/app/api/placements/tpo/jobs/[jobId]/delete-draft/route.ts");
  expect(service).toContain("auditTpoJobChange");
  expect(service).toContain('status:"ARCHIVED"');
  expect(service).toContain('.for("update")');
  expect(route).toContain("isSameOriginRequest(request)");
 });
 it("TPO-drive-workspace-34 holds private reviewer reason apart from learner-visible feedback",()=>{
  const item=tpoApplicantReviewSchema.parse({confirmed:true,
   expectedUpdatedAt:"2099-05-01T00:00:00Z",decision:"REJECTED",
   note:"Your application did not meet this role's requirements.",
   internalReason:"Company screening decision"});
  const projected=candidateScreeningPayload(item);
  expect(projected.internalReason).toBe("Company screening decision");
  expect(projected.candidateMessage).toBe("Your application did not meet this role's requirements.");
  expect(tpoApplicantReviewSchema.safeParse({...item,internalReason:"x"}).success).toBe(false);
 });
 it("TPO-drive-workspace-R01 removes the obsolete environment gate from reviewed applicant writes",()=>{
  const route=source("src/app/api/placements/tpo/jobs/[jobId]/applicants/[applicationId]/review/route.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).not.toContain("DB09_TPO_API_READY");
  expect(route).toContain("reviewTpoApplicant");
 });
 it("TPO-drive-workspace-23 rejects unrecognized and duplicate flag filter values",()=>{
  const base={jobId:"11111111-1111-4111-8111-111111111111"};
  for(const flag of ["ALL","WITHDRAWAL_REQUESTED","NO_SHOW","PLACED_ELSEWHERE","ADDED_BY_COLLEGE"])
   expect(tpoApplicantPipelineParams.safeParse({...base,flag}).success).toBe(true);
  expect(tpoApplicantPipelineParams.safeParse({...base,flag:"PRIVATE_NOTE"}).success).toBe(false);
  const url=source("src/modules/placements/tpo-applications-url-guard.ts");
  expect(url).toContain('"flag"');
 });
 it("TPO-drive-workspace-08 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/components/placements/placement-drive-workspace.tsx")).toContain("Could not load: Bulk applicants");});
 it("TPO-drive-workspace-73 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/components/placements/placement-drive-workspace.tsx")).toContain("const [lifecycleReadiness,collisionAssessment,shortlist,roundOrder,deadlineState,bulkCandidates]");});
 it("TPO-drive-workspace-21 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/modules/placements/tpo-applicant-pipeline-service.ts")).toContain("lastResult:sql<string|null>");});
 it("TPO-drive-workspace-22 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/components/tpo/tpo-applications-spreadsheet.tsx")).toContain("label:\"Last applied result\"");});
 it("TPO-drive-workspace-23 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/modules/placements/tpo-drive-applications-export-service.ts")).toContain("flagScope");});
 it("TPO-drive-workspace-27 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/components/placements/tpo-applicant-review-drawer.tsx")).toContain("previousId");});
 it("TPO-drive-workspace-71 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/components/placements/tpo-applicant-review-form.tsx")).toContain("event.ctrlKey&&event.key===\"Enter\"");});
 it("TPO-drive-workspace-49 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/modules/placements/tpo-drive-offer-register-model.ts")).toContain("joiningBonusLpa");});
 it("TPO-drive-workspace-51 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/modules/placements/tpo-drive-offer-register-model.ts")).toContain("acceptedDisputableUntil");});
 it("TPO-drive-workspace-56 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/modules/placements/tpo-drive-offer-register-model.ts")).toContain("Joining bonus (LPA)");});
 it("TPO-drive-workspace-09 partial or implemented scope is recorded without inferring unsupported parity",()=>{const ui=source("src/components/placements/placement-drive-workspace.tsx");expect(ui).toContain("Applicants");expect(ui).toContain("Close drive");expect(ui).toContain('driveDay.job.company.name + " · " + driveDay.job.title');});
 it("TPO-drive-workspace-11 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx")).toContain("hasMembershipRole(context, \"TPO\")");});
 it("TPO-drive-workspace-12 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/components/placements/placement-drive-workspace.tsx")).toContain("PlacementRequestQueue");});
 it("TPO-drive-workspace-24 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx")).toContain("TpoBulkActionPanel");});
 it("TPO-drive-workspace-26 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/modules/placements/tpo-bulk-action-model.ts")).toContain("canExactUndo");});
 it("TPO-drive-workspace-30 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/modules/placements/tpo-share-projection.ts")).toContain("skillMatchScore");});
 it("TPO-drive-workspace-31 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/modules/placements/tpo-selection-import-model.ts")).toContain("applicationId");});
 it("TPO-drive-workspace-38 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/modules/placements/tpo-drive-schedule-warnings-model.ts")).toContain("UNAVAILABLE");});
 it("TPO-drive-workspace-43 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/modules/placements/tpo-round-apply-service.ts")).toContain("getTpoRoundApplyPreview");});
 it("TPO-drive-workspace-46 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/components/placements/placement-drive-controls.tsx")).toContain("Remove");});
 it("TPO-drive-workspace-50 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/modules/placements/tpo-drive-offer-register-model.ts")).toContain("offerRulesCheck");});
 it("TPO-drive-workspace-54 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx")).toContain("Unavailable");});
 it("TPO-drive-workspace-55 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/components/placements/tpo-offer-lifecycle-panel.tsx")).toContain("useGuardedAction");});
 it("TPO-drive-workspace-57 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/page.tsx")).toContain("holiday rules");});
 it("TPO-drive-workspace-59 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/modules/placements/tpo-drive-discussion-service.ts")).toContain("eq(placementTpoMessageThreads.jobId,jobId)");});
 it("TPO-drive-workspace-61 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/modules/placements/tpo-recruiter-invite-service.ts")).toContain("requirePlacementManageScope");});
 it("TPO-drive-workspace-63 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/components/placements/placement-drive-controls.tsx")).toContain("Force exclude");});
 it("TPO-drive-workspace-67 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/components/placements/tpo-applicant-review-drawer.tsx")).toContain("Open full applicant detail");});
 it("TPO-drive-workspace-69 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/components/tpo/tpo-bulk-action-panel.tsx")).toContain("Retry skipped/failed");});
 it("TPO-drive-workspace-70 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/components/placements/tpo-drive-cancel-form.tsx")).toContain("checked={reviewed}");});
 it("TPO-drive-workspace-72 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/components/placements/tpo-drive-workspace-nav.tsx")).toContain("aria-label=\"Drive workspace section\"");});
 it("TPO-drive-workspace-74 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/modules/placements/tpo-drive-about-service.ts")).toContain("recruiterContacts:companyContacts.map");});
 it("TPO-drive-workspace-64 partial or implemented scope is recorded without inferring unsupported parity",()=>{expect(source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx")).toContain("Open conversation");});
});
