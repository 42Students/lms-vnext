import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {evaluateTpoDriveCancellation} from "@/modules/placements/tpo-drive-cancel-model";
import {evaluateTpoDriveClosure} from "@/modules/placements/tpo-drive-close-preview-model";

const src=(file:string)=>readFileSync(file,"utf8");
const impact={submittedApplications:3,openRounds:1,issuedOffers:2,acceptedOffers:1};
const counts={applications:3,rounds:1,offers:2};

describe("chat-5 TPO drive closure and correction journeys",()=>{
 it("PLACEMENTS-DRIVE-STOP-SM-24 preserves accepted commitments and rejects stale or suspended cancellations",()=>{
  expect(evaluateTpoDriveCancellation("PUBLISHED","ACTIVE",impact,impact)).toBe("ALLOW");
  expect(evaluateTpoDriveCancellation("DRAFT",null,impact,impact)).toBe("ALLOW");
  expect(evaluateTpoDriveCancellation("PUBLISHED","CLOSED",impact,impact)).toBe("READ_ONLY");
  expect(evaluateTpoDriveCancellation("CANCELLED","ACTIVE",impact,impact)).toBe("READ_ONLY");
  for(const changed of [
   {...impact,submittedApplications:2},{...impact,openRounds:0},
   {...impact,issuedOffers:1},{...impact,acceptedOffers:0},
  ])expect(evaluateTpoDriveCancellation("PUBLISHED","ACTIVE",changed,impact))
   .toBe("PREVIEW_STALE");
  const service=src("src/modules/placements/tpo-drive-cancel-service.ts");
  expect(service).toContain('eq(placementOffers.status, "ISSUED")');
  expect(service).toContain('status: "WITHDRAWN"');
  expect(service).toContain("endDriveApplicants(");
  expect(service).toContain("tellRecruiterDriveStopped(");
 });
 it("PLACEMENTS-DRIVE-CLOSE-SM-25 permits legitimate season-ended closure but blocks unissued selections and reserved seats",()=>{
  expect(evaluateTpoDriveClosure("PUBLISHED","CLOSED",counts,counts)).toBe("ALLOW");
  expect(evaluateTpoDriveClosure("PUBLISHED","ACTIVE",counts,counts,1)).toBe("UNRELEASED_SELECTIONS");
  expect(evaluateTpoDriveClosure("PUBLISHED","ACTIVE",counts,counts,2)).toBe("UNRELEASED_SELECTIONS");
  expect(evaluateTpoDriveClosure("PUBLISHED",null,counts,counts)).toBe("READ_ONLY");
  expect(evaluateTpoDriveClosure("CANCELLED","ACTIVE",counts,counts)).toBe("READ_ONLY");
  expect(evaluateTpoDriveClosure("PUBLISHED","ACTIVE",{...counts,offers:3},counts)).toBe("PREVIEW_STALE");
  const service=src("src/modules/placements/tpo-drive-close-preview-service.ts");
  expect(service).toContain("pendingWaitlistReservations(tx,job.id)");
  expect(service).toContain("pendingSelections+pendingPromotions");
  expect(service).toContain('eq(placementWaitlistPromotions.status,"PENDING")');
 });
 it("UX-PLACEMENTS-CLOSE-22 requires two-stage consequence review, preserves draft and guards offline retry",()=>{
  const component=src("src/components/placements/tpo-drive-close-preview-form.tsx");
  expect(component).toContain("<ConfirmDialog");
  expect(component).toContain('title="Close this drive?"');
  expect(component).toContain('minLength={10}');
  expect(component).toContain("expectedUpdatedAt:preview.expectedUpdatedAt");
  expect(component).toContain("expectedCounts:preview.counts");
  expect(component).toContain("useGuardedAction({timeoutMs:40000})");
  expect(component).toContain("await run(async()=>");
  expect(component).toContain("await apiFetch(");
  expect(component).toContain("timeoutMs:35000");
  expect(component).toContain("setConfirmOpen(false)");
  expect(component).toContain("setError(error instanceof Error?error.message:friendlyApiError({}))");
  expect(component).not.toContain("await fetch(");
 });
 it("UX-PLACEMENTS-JOINING-23 retains correction evidence and confirmation while preventing duplicate updates",()=>{
  const component=src("src/components/placements/tpo-joining-update-form.tsx");
  expect(component).toContain('const corrected = initialStatus !== "PENDING"');
  expect(component).toContain("if (!confirmed)");
  expect(component).toContain("setConfirmOpen(true)");
  expect(component).toContain('correctionReason: corrected ? correctionReason.trim() : null');
  expect(component).toContain("await run(async()=>");
  expect(component).toContain("useGuardedAction({timeoutMs:40000})");
  expect(component).toContain("} catch(caught) {");
  expect(component).toContain("setBusy(false)");
  expect(component).toContain("setConfirmOpen(false)");
  expect(component).toContain("await apiFetch(");
  expect(component).toContain("timeoutMs: 35000");
  expect(component).toContain("friendlyApiError({})");
  expect(component).toContain("<ConfirmDialog");
  expect(component).toContain('role="alert"');
  expect(component).not.toContain("await fetch(");
  expect(component).not.toContain("window.confirm(");
 });
});
