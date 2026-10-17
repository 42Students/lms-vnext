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
 it("TPO-drive-workspace-42 summarizes only staged round outcomes and invalidates edited previews",()=>{
  const rows=[{resultId:"b",applicationId:"student-b",student:"B",outcome:"PASS",status:"STAGED",version:1},
   {resultId:"a",applicationId:"student-a",student:"A",outcome:"FAIL",status:"APPLIED",version:1}];
  expect(summarizeRoundApply(rows)).toEqual({staged:1,applied:1,outcomes:{PASS:1,FAIL:0,HOLD:0,ABSENT:0}});
  const token=roundApplyPreviewToken("round",rows);
  expect(token).toBe(roundApplyPreviewToken("round",[rows[1]!,rows[0]!]));
  expect(token).not.toBe(roundApplyPreviewToken("round",[{...rows[0]!,version:2},rows[1]!]));
  expect(roundApplyInputSchema.safeParse({confirmed:true,expectedPreviewToken:token}).success).toBe(true);
  expect(roundApplyInputSchema.safeParse({confirmed:false,expectedPreviewToken:token}).success).toBe(false);
 });
 it("TPO-drive-workspace-44 generates separate rooms and refuses interviews spilling into the next IST day",()=>{
  const slots=planInterviewDay({startsAt:"2099-05-03T09:00:00+05:30",
   durationMinutes:30,gapMinutes:10,slotsPerRoom:2,rooms:["Room A","Room B"]});
  expect(slots).toHaveLength(4);
  expect(slots.map(row=>row.room)).toEqual(["Room A","Room A","Room B","Room B"]);
  expect(slots[0]!.startsAt.toISOString()).toBe("2099-05-03T03:30:00.000Z");
  expect(()=>planInterviewDay({startsAt:"2099-05-03T23:45:00+05:30",
    durationMinutes:30,gapMinutes:0,slotsPerRoom:1,rooms:["A"]})).toThrow(/midnight/);
  expect(tpoInterviewSlotActionSchema.safeParse({action:"CLEAR_AVAILABLE",confirmed:true}).success).toBe(true);
  expect(tpoInterviewSlotActionSchema.safeParse({action:"CLEAR_AVAILABLE",confirmed:false}).success).toBe(false);
 });
 it("TPO-drive-workspace-47 rejects unreviewed and duplicate selection releases",()=>{
  const id="11111111-1111-4111-8111-111111111111";
  const timestamp="2099-05-03T09:00:00+05:30";
  expect(releaseSelectionsSchema.safeParse({action:"VERIFY_AND_RELEASE",confirmed:true,
    selectionIds:[id],expectedRecordedAt:{[id]:timestamp}}).success).toBe(true);
  expect(releaseSelectionsSchema.safeParse({action:"VERIFY_AND_RELEASE",confirmed:false,
    selectionIds:[id],expectedRecordedAt:{[id]:timestamp}}).success).toBe(false);
  expect(releaseSelectionsSchema.safeParse({action:"VERIFY_AND_RELEASE",confirmed:true,
    selectionIds:[id,id],expectedRecordedAt:{[id]:timestamp}}).success).toBe(false);
  expect(summarizeSelectionRelease([{status:"released"},{status:"skipped",reason:"RULE_BLOCK"}]))
    .toEqual({released:1,skipped:1});
 });
 it("TPO-drive-workspace-48 matches company selection rows only on consistent internal identities",()=>{
  const id="11111111-1111-4111-8111-111111111111";
  const candidates=[{applicationId:id,name:"Akhil",email:"akhil@college.edu",
   roleTitle:"Graduate Trainee",offerReady:true,alreadyOffered:false}];
  const csv="Application ID,Email,Package LPA\n"+id+",akhil@college.edu,9.50";
  const good=prepareSelectionImport(csv,candidates,"Graduate Trainee");
  expect(good.accepted).toHaveLength(1);
  expect(good.accepted[0]?.annualCtcInr).toBe(950000);
  expect(prepareSelectionImport(csv.replace("akhil@college.edu","other@college.edu"),candidates,"Graduate Trainee").accepted).toHaveLength(0);
  expect(recordSelectionsSchema.safeParse({action:"RECORD",entries:[{
    applicationId:id,roleTitle:"Graduate Trainee",annualCtcInr:950000}]}).success).toBe(true);
 });
});
