import {describe,it,expect} from "vitest";
import {summarizeTpoBatchRegistrations,tpoRegistrationChoiceSchema} from "@/modules/placements/tpo-batch-registration-summary-model";
describe("TPO batch registration snapshot",()=>{
 it("keeps undecided or unavailable separate from unrecorded",()=>{
  const a=summarizeTpoBatchRegistrations(8,[{choice:"PLACEMENTS",count:2},{choice:"HIGHER_STUDIES",count:3}],true);
  expect(a).toMatchObject({activeLearners:8,registered:5,unrecorded:3});
  expect(a.byChoice?.PLACEMENTS).toBe(2);
  expect(summarizeTpoBatchRegistrations(8,[],false).registered).toBeNull();
 });
 it("rejects an invented registration choice",()=>{
  expect(tpoRegistrationChoiceSchema.safeParse("PLACED").success).toBe(false);
 });
});
