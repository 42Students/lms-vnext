import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {evaluateTpoDriveClosure,tpoDriveCloseSchema} from "@/modules/placements/tpo-drive-close-preview-model";
import {projectOfferLetterEvidence} from "@/modules/placements/tpo-offer-letter-evidence-model";
import {
 tpoShareableShortlistQuerySchema,projectRecruiterVisibleShortlist,tpoShareableShortlistCsv,
} from "@/modules/placements/tpo-shareable-shortlist-model";
import {projectTpoShortlist,tpoShortlistQuerySchema,tpoShortlistCsv} from "@/modules/placements/tpo-shortlist-model";
import {
 recoverCompanyShareLinkPage,clampCompanyShareLinksPage,companyShareLinksHref,
 companySharePreviewSearchState,prependCompanyShareLink,COMPANY_SHARE_PAGE_SIZE,
} from "@/modules/placements/company-share/link-page-model";

const uuid="11111111-1111-4111-8111-111111111111";
const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const page=(section:string)=>source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/"+section+"/page.tsx");
const counts={applications:10,rounds:2,offers:1};
describe("TPO second-third — close preview and cancellation model state",()=>{
 it("PLACEMENTS-CLOSE-SM-02 denies nonpublished or inactive seasons, unreleased selections, and any stale impact count",()=>{
  expect(evaluateTpoDriveClosure("PUBLISHED","ACTIVE",counts,counts,0)).toBe("ALLOW");
  expect(evaluateTpoDriveClosure("CLOSED","ACTIVE",counts,counts,0)).toBe("READ_ONLY");
  expect(evaluateTpoDriveClosure("PUBLISHED","CLOSED",counts,counts,0)).toBe("ALLOW");
  expect(evaluateTpoDriveClosure("PUBLISHED",null,counts,counts,0)).toBe("READ_ONLY");
  expect(evaluateTpoDriveClosure("PUBLISHED","ACTIVE",counts,counts,1)).toBe("UNRELEASED_SELECTIONS");
  for(const key of ["applications","rounds","offers"] as const)
   expect(evaluateTpoDriveClosure("PUBLISHED","ACTIVE",{...counts,[key]:counts[key]+1},counts,0)).toBe("PREVIEW_STALE");
 });
 it("PLACEMENTS-CLOSE-SM-03 requires explicit confirmation, exact nonnegative preview and reason, forbids forged IDs",()=>{
  const request={action:"CLOSE",confirmed:true,expectedUpdatedAt:"2099-10-18T05:30:00Z",
   expectedCounts:counts,reason:"Reconciled the final rounds and offers"};
  expect(tpoDriveCloseSchema.safeParse(request).success).toBe(true);
  for(const bad of [
   {...request,confirmed:false},{...request,expectedUpdatedAt:"oops"},
   {...request,expectedCounts:{...counts,offers:-1}},
   {...request,expectedCounts:{...counts,applications:3.4}},
   {...request,reason:"short"},{...request,collegeId:uuid},
  ])expect(tpoDriveCloseSchema.safeParse(bad).success).toBe(false);
 });
 it("PLACEMENTS-CLOSE-ENDED-01 both lifecycle and preview permit closing after season closure, never losing applicant reconciliation",()=>{
  const code=source("src/modules/placements/tpo-drive-close-preview-service.ts");
  expect(code).toContain('canClose:job.status==="PUBLISHED"&&Boolean(season)&&issuedOffers===0&&pendingSelections===0');
  expect(code).toContain("evaluateTpoDriveClosure(job.status,season?.status??null");
  expect(code).toContain("settleDriveWithdrawalRequests(");
  expect(code).toContain("endDriveApplicants(");
  expect(code).toContain("tellRecruiterDriveStopped(");
  expect(code).toContain("auditTpoJobChange(");
  const canonical=source("src/modules/placements/job-service.ts");
  const start=canonical.indexOf("export async function closePlacementJob");
  const end=canonical.indexOf("export function canCancelPublishedPlacementJob",start);
  const close=canonical.slice(start,end);
  expect(close).toContain('current.status !== "PUBLISHED"');
  expect(close).not.toContain("await requirePlacementJobSeasonActive(");
  const pageCode=page("close-preview");
  expect(pageCode).not.toContain("only for published drives in an active season");
  expect(pageCode).toContain("only for published drives with a recorded season");
 });
 it("PLACEMENTS-CLOSE-WAIT-12 refuses closure before a durable pending waitlist reservation is settled",()=>{
  const sourceCode=source("src/modules/placements/tpo-drive-close-preview-service.ts");
  const preview=sourceCode.slice(sourceCode.indexOf("export async function getTpoDriveClosePreview"),
    sourceCode.indexOf("export async function closeTpoDriveWithPreview"));
  const closure=sourceCode.slice(sourceCode.indexOf("export async function closeTpoDriveWithPreview"));
  expect(sourceCode).toContain('eq(placementWaitlistPromotions.status,"PENDING")');
  expect(preview).toContain("pendingPromotions=await pendingWaitlistReservations(tx,job.id)");
  expect(preview).toContain("pendingSelections===0&&pendingPromotions===0");
  expect(closure).toContain("pendingSelections+pendingPromotions");
  expect(closure).toContain('.for("update").limit(1)');
  expect(closure).toContain('if(decision==="UNRELEASED_SELECTIONS")throw new PlacementsServiceError("PLACEMENT_JOB_NOT_CLOSABLE")');
  const pageCode=page("close-preview");
  expect(pageCode).toContain("preview.pendingPromotions>0");
  expect(pageCode).toContain("A waitlisted learner's reserved offer is still pending.");
 });
 it("TPO-2ND-PAGE-close-preview-03 maintains guarded explicit form vs actionable blocked reason",()=>{
  const code=page("close-preview");
  expect(code).toContain('hasMembershipRole(context,"TPO")');
  expect(code).toContain('getTpoDriveClosePreview(context,jobId)');
  expect(code).toContain('preview.canClose?<TpoDriveClosePreviewForm');
  expect(code).toContain('preview.pendingSelections>0');
  expect(code).toContain("Verify and release, or withdraw, all pending company selections before closing this drive.");
  expect(code).toContain("Release or withdraw outstanding offers before closing this drive.");
 });
});
describe("TPO second-third — offer letters never invent proof",()=>{
 it("PLACEMENTS-LETTERS-01 tracks persisted offer timestamps but never invents signed/acknowledged delivery",()=>{
  const at=new Date("2099-10-18T10:00:00Z");
  const rows=projectOfferLetterEvidence([
   {offerId:uuid,offerStatus:"ISSUED",issuedAt:at,respondedAt:null},
   {offerId:"offer2",offerStatus:"ACCEPTED",issuedAt:at,respondedAt:at},
  ]);
  expect(rows).toHaveLength(2);
  expect(rows.every(row=>row.letterIssuedStatus==="UNAVAILABLE"&&row.letterAcknowledgedStatus==="UNAVAILABLE")).toBe(true);
  expect(rows[0]).toMatchObject({persistedOfferIssuedAt:at.toISOString(),offerRespondedAt:null});
  expect(rows[1].offerRespondedAt).toBe(at.toISOString());
 });
 it("TPO-2ND-PAGE-letters-02 enforces TPO and persisted scope, explains unsupported letters in an accessible table",()=>{
  const code=page("letters");
  for(const must of ['hasMembershipRole(context, "TPO")','can(context, "placements.manage", { collegeId })',
   'requirePermission(context, "placements.manage", { collegeId })',
   "requirePlacementManageScope(context, collegeId)","listPlacementJobOffers(context, parsed.data)",
   "letter document, delivery or acknowledgement","Bulk letter-status changes are disabled",
   'empty={<p role="status"','mobilePriority:"primary"'])
   expect(code).toContain(must);
 });
});
describe("TPO second-third — no private notes in a recruiter-facing shortlist",()=>{
 const input=[{applicationId:uuid,displayName:" =SUM(A1:A9)",email:"engineer@company.example",internalNotes:"PRIVATE"}];
 it("PLACEMENTS-SHARE-PREVIEW-01 projections expose only three approved fields, CSV neutralizes formulas",()=>{
  const projected=projectRecruiterVisibleShortlist(input);
  expect(projected).toEqual([{applicationId:uuid,displayName:"=SUM(A1:A9)",email:"engineer@company.example"}]);
  expect(JSON.stringify(projected)).not.toContain("PRIVATE");
  const csv=tpoShareableShortlistCsv(projected,true);
  expect(csv).toContain("'=SUM(A1:A9)");
  expect(csv).not.toContain("PRIVATE");
  expect(csv).toContain("More than 500 shortlisted application records: export truncated");
  expect(tpoShareableShortlistCsv(projected,false)).not.toContain("NOTICE");
 });
 it("PLACEMENTS-SHARE-PREVIEW-02 rejects malformed IDs and page/search overload",()=>{
  expect(tpoShareableShortlistQuerySchema.safeParse({jobId:uuid,page:1,q:"learner"}).success).toBe(true);
  for(const bad of [{jobId:"../other"},{jobId:uuid,page:0},{jobId:uuid,page:1.1},
   {jobId:uuid,q:"x".repeat(81)},{jobId:uuid,collegeId:uuid}])
   expect(tpoShareableShortlistQuerySchema.safeParse(bad).success).toBe(false);
 });
 it("TPO-2ND-PAGE-share-preview-03 never represents a read-only preview as external authorization",()=>{
  const code=page("share-preview");
  expect(code).toContain("not a sent share or authorization for an external recipient");
  expect(code).toContain("The CSV is capped");
  expect(code).toContain("500 application rows");
  expect(code).toContain("It performs no sharing.");
  expect(code).toContain("No recruiter-visible shortlisted applications are recorded on this page.");
  expect(code).toContain("listTpoCompanyApplicantShares(context");
 });
});
describe("TPO second-third — shortlist status and share-history pagination",()=>{
 it("PLACEMENTS-SHORTLIST-01 dates and absent roster fields do not become invented decisions",()=>{
  const projected=projectTpoShortlist([{applicationId:uuid,membershipId:uuid,
   name:" ",rollNumber:" ",roleTitle:"Engineer",decidedAt:null}]);
  expect(projected[0]).toMatchObject({displayName:"Unnamed learner",rollNumber:null,shortlistedAtIso:null});
  const csv=tpoShortlistCsv(projected);
  expect(csv).toContain("Unnamed learner");
  expect(csv).not.toContain("undefined");
  expect(tpoShortlistQuerySchema.safeParse({jobId:uuid,page:-1}).success).toBe(false);
 });
 it("PLACEMENTS-SHARE-PAGE-01 invalid link-page input recovers, independent applicant search retains status and link page",()=>{
  expect(recoverCompanyShareLinkPage("0")).toEqual({page:1,wasInvalid:true});
  expect(recoverCompanyShareLinkPage("1.5")).toEqual({page:1,wasInvalid:true});
  expect(recoverCompanyShareLinkPage(12)).toEqual({page:12,wasInvalid:false});
  expect(companySharePreviewSearchState("REVOKED",3)).toEqual({shareStatus:"REVOKED",sharePage:"3"});
  expect(companySharePreviewSearchState("ALL",1)).toEqual({});
  expect(clampCompanyShareLinksPage(999,51)).toEqual({page:3,totalPages:3});
  expect(COMPANY_SHARE_PAGE_SIZE).toBe(25);
  expect(companyShareLinksHref(uuid,"EXPIRED",3,"abc",2)).toContain("shareStatus=EXPIRED");
 });
 it("PLACEMENTS-SHARE-PAGE-02 creating a link replaces same-ID card and caps list without duplicating",()=>{
  const rows=Array.from({length:25},(_,i)=>({id:String(i)}));
  const after=prependCompanyShareLink(rows,{id:"2"});
  expect(after).toHaveLength(25);
  expect(after[0].id).toBe("2");
  expect(after.filter(item=>item.id==="2")).toHaveLength(1);
 });
});
