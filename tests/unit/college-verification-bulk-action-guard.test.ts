import {describe,it,expect} from "vitest";
import {canStartVerificationBulkPreview} from "@/modules/verification/bulk-action-guard";
describe("College bulk verification preview lock",()=>{
 it("requires non-empty bounded selection and an idle command",()=>{
  expect(canStartVerificationBulkPreview(false,1)).toBe(true);
  expect(canStartVerificationBulkPreview(false,20)).toBe(true);
  expect(canStartVerificationBulkPreview(false,0)).toBe(false);
  expect(canStartVerificationBulkPreview(false,21)).toBe(false);
  expect(canStartVerificationBulkPreview(true,4)).toBe(false);
 });
});
