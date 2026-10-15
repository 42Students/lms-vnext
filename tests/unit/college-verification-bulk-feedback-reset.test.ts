import {describe,it,expect} from "vitest";
import {emptyVerificationBulkFeedback} from "@/modules/verification/bulk-feedback-reset";
describe("Verification bulk result invalidation on selection change",()=>{
 it("does not retain prior result or shared correction note",()=>{
  const state=emptyVerificationBulkFeedback();
  expect(state).toEqual({pendingAction:null,reason:"",error:"",result:null});
  expect(state.result).toBeNull();
 });
});
