import {describe,expect,it} from "vitest";
import {parseTpoRoundImport,roundImportActionSchema} from "@/modules/placements/tpo-round-import-model";
import {parseSelectionCsv,prepareSelectionImport} from "@/modules/placements/tpo-selection-import-model";
import {roundApplyPreviewToken,roundApplyInputSchema,summarizeRoundApply} from "@/modules/placements/tpo-round-apply-model";
import {planInterviewDay,tpoInterviewSlotActionSchema} from "@/modules/placements/tpo-interview-slot-model";
import {recordSelectionsSchema,releaseSelectionsSchema,summarizeSelectionRelease} from "@/modules/placements/tpo-drive-selection-model";
import {tpoWaitlistPromotionSchema,waitlistPreviewToken} from "@/modules/placements/tpo-waitlist-promotion-model";
import {driveChangeCommandSchema} from "@/modules/placements/tpo-drive-change-request-model";
import {projectTpoDriveHeader} from "@/modules/placements/tpo-drive-header-model";
import {placementReminderDay,placementReminderPreviewToken,tpoRemindNotAppliedSchema} from "@/modules/placements/tpo-remind-not-applied-model";
import {evaluateTpoDriveCancellation,isIssuedOfferCancelable} from "@/modules/placements/tpo-drive-cancel-model";

describe("TPO drive workspace verified S1 gaps",()=>{
 it("TPO-drive-workspace-40 accepts 1000 reviewed CSV results and refuses unreviewable 1001st, conflicting headers and blank rows",()=>{
  const lines=["Application ID,Result",...Array.from({length:1000},(_,i)=>"candidate-"+i+",PASS")];
  expect(parseTpoRoundImport(Buffer.from(lines.join("\n")),"company.csv")).toHaveLength(1000);
  expect(()=>parseTpoRoundImport(Buffer.from([...lines,"candidate-next,FAIL"].join("\n")),"company.csv")).toThrow();
  expect(()=>parseTpoRoundImport(Buffer.from("Application ID,Result,Outcome\na,PASS,PASS"),"company.csv")).toThrow(/same field/);
  expect(()=>parseTpoRoundImport(Buffer.from("Application ID,Result\na,PASS\n\nb,FAIL"),"company.csv")).toThrow(/blank/);
  expect(roundImportActionSchema.safeParse({action:"STAGE_IMPORT",confirmed:true,previewToken:"a".repeat(64),
    missingPolicy:"MARK_NOT_CLEARED",overrides:[],skippedLines:[]}).success).toBe(true);
  expect(roundImportActionSchema.safeParse({action:"STAGE_IMPORT",confirmed:true,previewToken:"a".repeat(64),
    missingPolicy:"MARK_NOT_CLEARED",overrides:[],skippedLines:[4,4]}).success).toBe(false);
 });
 it("TPO-drive-workspace-18 retains an accepted offer while closing only a published drive with reviewed counts",()=>{
  const original={submittedApplications:2,openRounds:2,issuedOffers:1,acceptedOffers:1};
  expect(evaluateTpoDriveCancellation("PUBLISHED","ACTIVE",original,original)).toBe("ALLOW");
  expect(isIssuedOfferCancelable("ISSUED")).toBe(true);
  expect(isIssuedOfferCancelable("ACCEPTED")).toBe(false);
  expect(evaluateTpoDriveCancellation("PUBLISHED","ACTIVE",original,{...original,openRounds:1})).toBe("PREVIEW_STALE");
  expect(evaluateTpoDriveCancellation("DRAFT","ACTIVE",original,original)).toBe("READ_ONLY");
 });
 it("TPO-drive-workspace-28 dedupes same-day reminders and requires confirmed reviewed recipient token",()=>{
  const day=placementReminderDay(new Date("2099-04-01T20:00:00Z"));
  expect(day).toBe("2099-04-02");
  const token=placementReminderPreviewToken("job",day,["b","a"]);
  expect(token).toBe(placementReminderPreviewToken("job",day,["a","b"]));
  expect(token).not.toBe(placementReminderPreviewToken("job","2099-04-03",["a","b"]));
  expect(tpoRemindNotAppliedSchema.safeParse({action:"REMIND",confirmed:true,expectedPreviewToken:token}).success).toBe(true);
  expect(tpoRemindNotAppliedSchema.safeParse({action:"REMIND",confirmed:false,expectedPreviewToken:token}).success).toBe(false);
 });
});
