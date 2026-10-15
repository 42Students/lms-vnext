import {describe,it,expect} from "vitest";
import {selectEligibleVerificationKeys,verificationSelectionKey} from "@/modules/verification/selection-model";
describe("College verification immutable bulk selection snapshot",()=>{
 it("uses only currently eligible waiting rows",()=>{
  const rows=[{learnerMembershipId:"a",section:"EDUCATION" as const,status:"SUBMITTED"},
   {learnerMembershipId:"b",section:"IDENTITY" as const,status:"VERIFIED"}];
  const selected=selectEligibleVerificationKeys(rows);
  expect(selected).toEqual(new Set([verificationSelectionKey(rows[0]!)]));
  expect(selected.has(verificationSelectionKey(rows[1]!))).toBe(false);
 });
});
