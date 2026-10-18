import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {
 projectTpoJoiningTracker,type TpoJoiningSourceRow,
} from "@/modules/placements/tpo-joining-tracker-model";
import {evaluateTpoDriveCancellation} from "@/modules/placements/tpo-drive-cancel-model";
import {evaluateTpoDriveClosure} from "@/modules/placements/tpo-drive-close-preview-model";

const page=(screen:string)=>readFileSync(
 "src/app/(authenticated)/tpo/placements/jobs/[jobId]/"+screen+"/page.tsx","utf8");

describe("chat-5 second-third TPO page journeys",()=>{
 it("UX-TPO-DRIVE-STOP-37 provides 44px return actions and explicit blocked-state messages on both previews",()=>{
  for(const screen of ["close-preview","cancel-preview"]){
   const source=page(screen);
   expect(source).toContain('hasMembershipRole(context,"TPO")');
   expect(source).toContain("notFound()");
   expect(source).toContain("role=\"status\"");
   expect(source).toContain("inline-flex min-h-11 items-center");
   expect(source).toContain("<PageHeader");
   expect(source).toContain("preview.");
  }
  expect(page("close-preview")).toContain("pendingPromotions>0");
  expect(page("cancel-preview")).toContain("pendingPromotions>0");
  const before={applications:5,rounds:2,offers:1};
  expect(evaluateTpoDriveClosure("PUBLISHED","ACTIVE",before,before)).toBe("ALLOW");
  expect(evaluateTpoDriveClosure("PUBLISHED","ACTIVE",before,before,1))
   .toBe("UNRELEASED_SELECTIONS");
  const impact={submittedApplications:5,openRounds:2,issuedOffers:1,acceptedOffers:0};
  expect(evaluateTpoDriveCancellation("PUBLISHED","ACTIVE",impact,impact))
   .toBe("ALLOW");
  expect(evaluateTpoDriveCancellation("CANCELLED","ACTIVE",impact,impact))
   .toBe("READ_ONLY");
 });
 it("TPO-JOIN-PAGE-38 never interprets ISSUED letters or missing joining evidence as confirmed joining",()=>{
  const base: TpoJoiningSourceRow={
   offer:{id:"offer-a",status:"ISSUED",roleTitle:"Engineer",annualCtcInr:900000,
    issuedAt:new Date("2099-10-18T12:30:00Z")},
   candidate:{membershipId:"membership-a",displayName:"Learner A"},
   joining:null,
  };
  const accepted:{[K in keyof TpoJoiningSourceRow]:TpoJoiningSourceRow[K]}={
   ...base,offer:{...base.offer,id:"offer-b",status:"ACCEPTED"},
  };
  const completed:TpoJoiningSourceRow={
   ...base,offer:{...base.offer,id:"offer-c",status:"ACCEPTED"},
   joining:{status:"JOINED",joiningDate:"2099-10-19",reason:null},
  };
  const projected=projectTpoJoiningTracker([base,accepted,completed]);
  expect(projected.counts).toEqual({
   accepted:2,pending:1,joined:1,deferred:0,didNotJoin:0,
  });
  expect(projected.items.map(row=>row.offerId)).toEqual(["offer-b","offer-c"]);
  expect(projected.items[0]?.hasRecordedOutcome).toBe(false);
  expect(projected.items[0]?.joiningDate).toBeNull();
  expect(projected.items[1]?.hasRecordedOutcome).toBe(true);
  const pageCode=page("joining");
  expect(pageCode).toContain("getTpoJoiningTracker(context, parsed.data)");
  expect(pageCode).toContain("Record joining outcomes only for persisted accepted offers");
  expect(pageCode).toContain("<TpoJoiningUpdateForm");
 });
 it("TPO-2ND-PAGE-SCOPE-39 requires TPO role and scoped service before showing each drive-workspace page",()=>{
  const screens=[
   ["offers","getTpoDriveOfferRegister"],
   ["selections","getTpoSelectionWorkspace"],
   ["waitlist","getTpoWaitlistPreview"],
   ["joining","getTpoJoiningTracker"],
   ["close-preview","getTpoDriveClosePreview"],
   ["cancel-preview","getTpoDriveCancelPreview"],
   ["rounds","getPlacementDriveDay"],
   ["drive-day","getPlacementDriveDay"],
  ] as const;
  for(const [screen,reader] of screens){
   const source=page(screen);
   expect(source,screen).toContain('redirect("/dashboard")');
   expect(source,screen).toContain("hasMembershipRole(context");
   expect(source,screen).toContain(reader);
   expect(source,screen).toContain("<PageHeader");
   expect(source,screen).toContain("min-w-0");
   expect(source,screen).not.toContain("dangerouslySetInnerHTML");
  }
  for(const screen of ["offers","selections","waitlist","joining","close-preview","cancel-preview"]){
   expect(page(screen),screen).toContain("notFound()");
  }
 });
});
