import {it,expect,describe} from "vitest";
import {canAdminSettleDelivery,adminDeliveryToast} from "@/modules/projects/admin-submission-review-model";
describe("COL-projects-01 final delivery settlement",()=>{
 it("restricts decisions to submitted, and lock to submitted/approved",()=>{
  expect(canAdminSettleDelivery("SUBMITTED",false,"ACTIVE","APPROVED")).toBe(true);
  expect(canAdminSettleDelivery("SUBMITTED",false,"ACTIVE","CHANGES_REQUESTED")).toBe(true);
  expect(canAdminSettleDelivery("SUBMITTED",false,"ACTIVE","LOCK")).toBe(true);
  expect(canAdminSettleDelivery("APPROVED",false,"ACTIVE","LOCK")).toBe(true);
  expect(canAdminSettleDelivery("APPROVED",false,"ACTIVE","CHANGES_REQUESTED")).toBe(false);
  expect(canAdminSettleDelivery("SUBMITTED",true,"ACTIVE","APPROVED")).toBe(false);
  expect(canAdminSettleDelivery("SUBMITTED",false,"ARCHIVED","LOCK")).toBe(false);
 });
 it("retains exact legacy success messages",()=>{
  expect(adminDeliveryToast("APPROVED")).toBe("Submission accepted.");
  expect(adminDeliveryToast("CHANGES_REQUESTED")).toBe("Changes requested.");
  expect(adminDeliveryToast("LOCK")).toBe("Submission locked.");
 });
});
