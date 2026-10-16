import {describe,expect,it} from "vitest";
import {publicJoinMobileSchema} from "@/modules/placements/public-join/form-model";
import {joinErrorMessage} from "@/modules/placements/public-join/error-copy";
describe("TPO-campaigns-public-R01 mobile isn't silently dropped",()=>{
 it("accepts national and +91 numbers, but rejects invalid input",()=>{
  expect(publicJoinMobileSchema.parse("+91 98765 43210")).toBe("9876543210");
  expect(publicJoinMobileSchema.parse("9876543210")).toBe("9876543210");
  expect(publicJoinMobileSchema.safeParse("1234").success).toBe(false);
 });
 it("shows a clear storage migration gate if phone was provided",()=>{
  expect(joinErrorMessage("PHONE_STORAGE_NOT_READY")).toContain("Remove the optional mobile");
 });
});
