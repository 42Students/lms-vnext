import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {tpoGeneralRequestInputSchema,tpoGeneralRequestTarget,tpoGeneralRequestDecisionSchema}
 from "@/modules/placements/tpo-general-request-model";

const uuid="11111111-1111-4111-8111-111111111111";
const round="22222222-2222-4222-8222-222222222222";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("chat-15 learner general placement requests",()=>{
 it("LEARNER-placements-51 validates registration changes, off-campus offers and corrections before persistence",()=>{
  const registration=tpoGeneralRequestInputSchema.parse({kind:"REGISTRATION_CHANGE",reason:"Please change my choice",
   cohortId:uuid,choice:"HIGHER_STUDIES",consentConfirmed:false});
  expect(tpoGeneralRequestTarget(registration)).toBe(uuid);
  expect(tpoGeneralRequestInputSchema.safeParse({kind:"OFF_CAMPUS_OFFER",
   reason:"External offer received",companyName:"Example Company",ctcLpa:"7.50",proofUrl:"https://example.com/proof"}).success).toBe(true);
  expect(tpoGeneralRequestInputSchema.safeParse({kind:"CORRECTION_WITH_PROOF",
   reason:"My marks are incorrect",section:"EDUCATION",field:"Percentage",
   proposedValue:"80",proofUrl:"javascript:alert(1)"}).success).toBe(false);
  expect(tpoGeneralRequestInputSchema.safeParse({kind:"OFF_CAMPUS_OFFER",
   reason:"External offer received",companyName:"Example Company",ctcLpa:"-4"}).success).toBe(false);
  const placement=source("src/app/(authenticated)/learn/my-placements/placement/page.tsx");
  expect(placement).toContain("<LearnerGeneralRequests");
  expect(source("src/db/schema/index.ts")).toContain("placement-general-requests");
  expect(source("src/app/api/placements/requests/general/route.ts")).toContain("isSameOriginRequest(request)");
 });
 it("LEARNER-placements-52 records a recipient-owned absence dispute instead of a silent attendance change",()=>{
  const dispute=tpoGeneralRequestInputSchema.parse({kind:"ABSENCE_DISPUTE",
   reason:"I attended this interview",applicationId:uuid,roundId:round,proofUrl:""});
  expect(tpoGeneralRequestTarget(dispute)).toContain(round);
  expect(tpoGeneralRequestInputSchema.safeParse({kind:"ABSENCE_DISPUTE",
   reason:"No",applicationId:uuid,roundId:round}).success).toBe(false);
  const writer=source("src/modules/placements/tpo-general-request-service.ts");
  expect(writer).toContain('kind:input.kind');
  expect(writer).toContain("verifyLearnerTx");
  expect(writer).toContain('throw new TpoGeneralRequestError("EFFECT_UNSUPPORTED")');
  expect(source("docs/proposed-migrations/learner-general-placement-requests.sql"))
    .toContain("placement_learner_general_request_events");
 });
 it("LEARNER-placements-51 rejects non-confirmed or stale TPO decisions",()=>{
  expect(tpoGeneralRequestDecisionSchema.safeParse({confirmed:true,version:uuid,action:"REJECT",note:"Policy requires more proof"}).success).toBe(true);
  expect(tpoGeneralRequestDecisionSchema.safeParse({confirmed:false,version:uuid,action:"APPROVE",note:""}).success).toBe(false);
 });
 it("LEARNER-placements-52 offers a prefilled dispute for a persisted ABSENT round",()=>{
  const journey=source("src/components/placements/learner-placement-journey.tsx");
  expect(journey).toContain('result.outcome==="ABSENT"&&result.appliedAt&&result.roundId');
  expect(journey).toContain("Wrong? Tell the placement cell");
  expect(journey).toContain('request:"absence-dispute"');
  expect(journey).toContain("roundId:result.roundId");
  const page=source("src/app/(authenticated)/learn/my-placements/placement/page.tsx");
  expect(page).toContain('prefillAbsence=query.request==="absence-dispute"');
  expect(page).toContain('initialKind={prefillAbsence?"ABSENCE_DISPUTE":"OFF_CAMPUS_OFFER"}');
 });
});
