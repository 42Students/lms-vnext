import {describe,expect,it} from "vitest";
import {offerExpiryWriteDecision} from "@/modules/placements/tpo-drive-offer-register-model";

const now=new Date("2026-10-22T12:00:00.000Z");
const overdue=new Date("2026-10-21T12:00:00.000Z");

describe("legacy offer expiry reconciliation",()=>{
 it("preserves an already accepted answer before considering the response deadline",()=>{
  expect(offerExpiryWriteDecision({
   offerStatus:"ISSUED",respondedAt:null,respondBy:overdue,
   applicationDecision:"ACCEPTED",now,
  })).toBe("RECONCILE_ACCEPTED");
 });
 it("preserves an already declined answer before considering the response deadline",()=>{
  expect(offerExpiryWriteDecision({
   offerStatus:"ISSUED",respondedAt:null,respondBy:overdue,
   applicationDecision:"DECLINED",now,
  })).toBe("RECONCILE_DECLINED");
 });
 it("expires only unanswered overdue offers",()=>{
  expect(offerExpiryWriteDecision({
   offerStatus:"ISSUED",respondedAt:null,respondBy:overdue,
   applicationDecision:null,now,
  })).toBe("MARK_EXPIRED");
 });
 it("never treats a nonexpired or already answered offer as an expiry candidate",()=>{
  expect(offerExpiryWriteDecision({
   offerStatus:"ISSUED",respondedAt:null,respondBy:new Date("2026-10-23T12:00:00.000Z"),
   applicationDecision:null,now,
  })).toBe("NO_CHANGE");
  expect(offerExpiryWriteDecision({
   offerStatus:"ISSUED",respondedAt:now,respondBy:overdue,
   applicationDecision:null,now,
  })).toBe("NO_CHANGE");
 });
});
