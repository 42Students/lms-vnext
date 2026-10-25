import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoSelectionReleaseFailureMessage,recordSelectionsSchema,releaseSelectionsSchema,matchesTpoSelectionReleaseRevision} from "@/modules/placements/tpo-drive-selection-model";
import {PlacementsServiceError} from "@/modules/placements/errors";

const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const id="11111111-1111-4111-8111-111111111111";
describe("TPO release — no internal errors leak in partial results",()=>{
 it("PLACEMENTS-SELECTION-ERROR-02 hides SQL, authorization, stack and uncontrolled messages",()=>{
  for(const err of [new Error('select * from auth_secrets; password=abc'),
    new Error('duplicate key violates unique constraint "placement_drive_selections_key"'),
    new Error("actor 123 has no permission: placements.manage"),new TypeError("null row"),
    {message:"database-user-secret"},null,undefined,"http://localhost/internal",42,
    new PlacementsServiceError("PLACEMENT_OFFER_ACTIVE_EXISTS")]){
   const display=tpoSelectionReleaseFailureMessage(err);
   expect(display).toBe("Could not release this selection. Refresh and try again or contact your administrator.");
   expect(display).not.toMatch(/password|secret|duplicate|SQL|constraint|placements\.manage|localhost/i);
  }
 });
 it("PLACEMENTS-SELECTION-ERROR-03 gives only the known stale-preview action",()=>{
  expect(tpoSelectionReleaseFailureMessage(new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE")))
   .toBe("This selection changed. Refresh before releasing.");
  expect(tpoSelectionReleaseFailureMessage(new Error("PLACEMENT_JOB_PREVIEW_STALE")))
   .toBe("This selection changed. Refresh before releasing.");
 });
 it("PLACEMENTS-SELECTION-ERROR-04 routes both reconciliation and issuing failures through safe presentation, preserving partial results",()=>{
  const service=src("src/modules/placements/tpo-drive-selection-service.ts");
  expect(service.match(/reason:tpoSelectionReleaseFailureMessage\(error\)/g)).toHaveLength(2);
  expect(service).not.toContain("reason:error instanceof Error?error.message");
  expect(service).not.toContain('throw new Error("Offer issued but selection status needs reconciliation")');
  expect(service).toContain("summarizeSelectionRelease(results)");
  expect(service).toContain("results.push(");
 });
 it("PLACEMENTS-SELECTION-RECONCILE-02/03 requires a locked matching version, official offer and canonical active state on every reconciliation",()=>{
  const code=src("src/modules/placements/tpo-drive-selection-service.ts");
  const reconcile=code.slice(code.indexOf('if(selection.status==="VERIFIED"'),code.indexOf('if(candidate?.offer&&',code.indexOf('if(selection.status==="VERIFIED"')));
  expect(reconcile).toContain('candidate.offer.kind==="OFFER"');
  expect(reconcile).toContain('matchesTpoSelectionReleaseRevision(locked,selection,expectedRecordedAt)');
  expect(reconcile).toContain('.for("update").limit(1)');
  expect(reconcile).toContain('persistedOffer.kind!=="OFFER"');
  expect(reconcile).toContain('persistedOffer.applicationId!==locked.applicationId');
  expect(reconcile).toContain('persistedOffer.roleTitle!==locked.roleTitle');
  expect(reconcile).toContain('persistedOffer.annualCtcInr!==locked.annualCtcInr');
  expect(reconcile).toContain('if(locked.status==="RELEASED"&&locked.releasedOfferId===offerId)return');
  expect(reconcile.indexOf('if(locked.status!=="VERIFIED")'))
    .toBeLessThan(reconcile.indexOf('status:"RELEASED",releasedOfferId:offerId'));
  // The post-issue write path also checks the client's original exact terms,
  // not merely VERIFIED, before accounting an offer release.
  const after=code.slice(code.indexOf('const offer=await issuePlacementOffer('));
  expect(after).toContain('matchesTpoSelectionReleaseRevision(locked,selection,expectedRecordedAt)');
  expect(after).toContain('if(locked.status==="RELEASED"&&locked.releasedOfferId===offer.id)return');
 });
 it("PLACEMENTS-SELECTION-CAS-04 behaviour: a version and every visible offer term must match exactly",()=>{
  const current={recordedAt:new Date("2099-10-18T05:30:00Z"),applicationId:id,
    roleTitle:"Engineer",annualCtcInr:900000};
  const shown={applicationId:id,roleTitle:"Engineer",annualCtcInr:900000};
  const token=current.recordedAt.toISOString();
  expect(matchesTpoSelectionReleaseRevision(current,shown,token)).toBe(true);
  expect(matchesTpoSelectionReleaseRevision(current,shown,"2099-10-18T05:30:01.000Z")).toBe(false);
  expect(matchesTpoSelectionReleaseRevision({...current,recordedAt:new Date(Number.NaN)},shown,token)).toBe(false);
  expect(matchesTpoSelectionReleaseRevision({...current,applicationId:"another"},shown,token)).toBe(false);
  expect(matchesTpoSelectionReleaseRevision({...current,roleTitle:"Engineer II"},shown,token)).toBe(false);
  expect(matchesTpoSelectionReleaseRevision({...current,annualCtcInr:899999},shown,token)).toBe(false);
  expect(matchesTpoSelectionReleaseRevision({...current,annualCtcInr:null},shown,token)).toBe(false);
  expect(matchesTpoSelectionReleaseRevision({...current,annualCtcInr:null},
    {...shown,annualCtcInr:null},token)).toBe(true);
 });
 it("PLACEMENTS-SELECTION-CAS-05 treats offset-equivalent versions as identical but rejects different instants and terms",()=>{
  const saved={recordedAt:new Date("2099-10-18T05:30:00.000Z"),applicationId:id,
    roleTitle:"Graduate engineer",annualCtcInr:950000};
  const displayed={applicationId:id,roleTitle:"Graduate engineer",annualCtcInr:950000};
  const equivalent="2099-10-18T11:00:00.000+05:30";
  expect(releaseSelectionsSchema.safeParse({action:"VERIFY_AND_RELEASE",confirmed:true,
    selectionIds:[id],expectedRecordedAt:{[id]:equivalent}}).success).toBe(true);
  expect(matchesTpoSelectionReleaseRevision(saved,displayed,equivalent)).toBe(true);
  expect(matchesTpoSelectionReleaseRevision(saved,displayed,"2099-10-18T11:00:00.001+05:30")).toBe(false);
  expect(matchesTpoSelectionReleaseRevision(saved,displayed,"bad")).toBe(false);
  expect(matchesTpoSelectionReleaseRevision(saved,{...displayed,roleTitle:"Different job"},equivalent)).toBe(false);
  expect(matchesTpoSelectionReleaseRevision(saved,{...displayed,annualCtcInr:950001},equivalent)).toBe(false);
  const service=src("src/modules/placements/tpo-drive-selection-service.ts");
  // The immutable expected revision is read once for each selected ID.
  expect(service).toContain("const expectedRecordedAt = input.expectedRecordedAt[id]");
  expect(service).toContain("!matchesTpoSelectionReleaseRevision(selection,selection,expectedRecordedAt)");
 });
 it("PLACEMENTS-SELECTION-CAS-06 rechecks all displayed selection terms under the verification lock",()=>{
  const service=src("src/modules/placements/tpo-drive-selection-service.ts");
  const start=service.indexOf("const candidateMap=new Map(",service.indexOf("export async function verifyAndReleaseTpoSelections"));
  const verification=service.slice(start,service.indexOf("const offer=await issuePlacementOffer(",start));
  expect(verification).toContain("!matchesTpoSelectionReleaseRevision(locked,selection,expectedRecordedAt)");
  expect(verification).not.toContain("locked.recordedAt.toISOString()!==input.expectedRecordedAt[id]");
  expect(verification).toContain('!["SELECTED","VERIFIED"].includes(locked.status)');
  expect(verification).toContain('await requireTpoJobActor(tx,context)');
  expect(verification).toContain('.for("update").limit(1)');
 });
 it("PLACEMENTS-SELECTION-SEASON-06 locks the owning season before every selection mutation",()=>{
  const service=src("src/modules/placements/tpo-drive-selection-service.ts");
  const check=service.slice(service.indexOf("async function requireActiveTpoSelectionSeason"),service.indexOf("const pendingCode"));
  expect(check).toContain('eq(placementJobs.collegeId,collegeId)');
  expect(check).toContain('eq(placementSeasons.id,placementJobs.seasonId)');
  expect(check).toContain('.for("share").limit(1)');
  expect(check).toContain('row?.status!=="ACTIVE"');
  expect(check).toContain('row.seasonCollegeId!==collegeId');
  const writes=service.slice(service.indexOf("export async function recordTpoDriveSelections"));
  expect(writes.match(/await requireActiveTpoSelectionSeason\(tx,job.id,context.membership!\.collegeId\)/g)).toHaveLength(3);
  // Reconciliation of a previously issued, matching OFFER remains possible
  // after closeout. Only new verification, record or issue is disallowed.
  const prior=service.slice(service.indexOf('if(selection.status==="VERIFIED"'),service.indexOf('if(candidate?.offer&&',service.indexOf('if(selection.status==="VERIFIED"')));
  expect(prior).not.toContain("await requireActiveTpoSelectionSeason(");
  expect(prior).toContain('persistedOffer.kind!=="OFFER"');
 });
 it("PLACEMENTS-SELECTION-ERROR-05 never trusts surplus college ID or invalid release version",()=>{
  expect(recordSelectionsSchema.safeParse({action:"RECORD",entries:[],collegeId:id}).success).toBe(false);
  expect(releaseSelectionsSchema.safeParse({action:"VERIFY_AND_RELEASE",confirmed:true,
   selectionIds:[id],expectedRecordedAt:{[id]:"garbage"}}).success).toBe(false);
 });
});