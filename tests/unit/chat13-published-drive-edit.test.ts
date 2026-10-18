import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {superAdminPublishedDriveEditSchema} from "@/modules/placements/super-admin-published-drive-edit-model";
import {superAdminPublishedDriveEditFeedback} from "@/modules/placements/super-admin-published-drive-edit-feedback";
const read=(p:string)=>readFileSync(p,"utf8");
const input={confirmed:true,expectedUpdatedAt:"2099-01-01T00:00:00.000Z",reason:"Update posting terms",
 title:"Example role",description:"Work details",locations:["Hyderabad"],
 applicationDeadline:"2099-12-31T00:00:00.000Z",openings:3,
 minimumAnnualCtcInr:500000,maximumAnnualCtcInr:900000};
describe("Super Admin published drive editing",()=>{
 it("SA-placements-projects-13 validates published edits and rejects invalid compensation",()=>{
  expect(superAdminPublishedDriveEditSchema.safeParse(input).success).toBe(true);
  expect(superAdminPublishedDriveEditSchema.safeParse({
   ...input,maximumAnnualCtcInr:100000,
  }).success).toBe(false);
  expect(superAdminPublishedDriveEditSchema.safeParse({
   ...input,locations:["Hyderabad","hyderabad"],
  }).success).toBe(false);
 });
 it("SA-placements-projects-13 enforces selected-college and optimistic version locks",()=>{
  const service=read("src/modules/placements/super-admin-published-drive-edit-service.ts");
  expect(service).toContain("resolveActingCollege(context");
  expect(service).toContain("assertPersistedPlatformPermission(tx,context");
  expect(service).toContain('job.status!=="PUBLISHED"');
  expect(service).toContain("date_trunc('milliseconds'");
  expect(service).toContain("recordActivityEventInTransaction(tx,context");
 });
 it("SA-placements-projects-13 forbids shortening a published deadline ahead of its assessment",()=>{
  const service=read("src/modules/placements/super-admin-published-drive-edit-service.ts");
  expect(service).toContain("job.legacyPostingDetails?.assessmentDeadline");
  expect(service).toContain("isLegacyAssessmentDeadlineAfterApplication");
  expect(service).toContain('new PlacementsServiceError("PLACEMENT_JOB_INVALID_DEADLINE")');
  expect(superAdminPublishedDriveEditFeedback("PLACEMENT_JOB_INVALID_DEADLINE","fallback"))
   .toContain("Assessment deadline must be after application deadline.");
 });
 it("SA-placements-projects-13 supplies machine-coded HTTP 409 for stale edits and informative form recovery",()=>{
  const service=read("src/modules/placements/super-admin-published-drive-edit-service.ts");
  const response=read("src/lib/api-error.ts");
  const component=read("src/components/placements/super-admin-published-drive-edit.tsx");
  expect(service).toContain('new PlacementsServiceError("PLACEMENT_JOB_STALE")');
  expect(service).toContain('job.updatedAt.getTime()!==Date.parse(cmd.expectedUpdatedAt)');
  expect(service).toContain("date_trunc('milliseconds'");
  expect(response).toContain("if (error instanceof PlacementsServiceError)");
  expect(superAdminPublishedDriveEditFeedback("PLACEMENT_JOB_STALE","fallback"))
   .toContain("Reload the current details");
  expect(superAdminPublishedDriveEditFeedback("PLACEMENT_ROLE_OPTION_DUPLICATE","fallback"))
   .toContain("Another active role");
  expect(superAdminPublishedDriveEditFeedback(null,"Safe fallback")).toBe("Safe fallback");
  expect(component).toContain("e instanceof FriendlyFetchError?e.code:null");
  expect(component).toContain("superAdminPublishedDriveEditFeedback(");
 });
 it("SA-placements-projects-13 uses guarded form and IST-aware deadline",()=>{
  const component=read("src/components/placements/super-admin-published-drive-edit.tsx");
  expect(component).toContain("useGuardedAction");
  expect(component).toContain("driveDeadlineIstToIso");
  expect(component).toContain("Existing applications and offer decisions remain unchanged.");
 });
});
