import {describe,expect,it} from "vitest";
import {joinErrorMessage} from "@/modules/placements/public-join/error-copy";
describe("TPO-campaigns-public-R02 explicit join failure copy",()=>{
 it("differentiates wrong, expired, locked and removed",()=>{
  expect(joinErrorMessage("WRONG_CODE")).toBe("That code isn't right. Check the latest email from us.");
  expect(joinErrorMessage("CODE_EXPIRED")).toBe("That code has expired. Send a new one.");
  expect(joinErrorMessage("CODE_LOCKED")).toBe("Too many wrong codes. Send a new one.");
  expect(joinErrorMessage("ACCESS_REMOVED")).toContain("Your access was removed by the placement cell.");
 });
 it("shows explicit service gate, never a generic success",()=>{
  expect(joinErrorMessage("SERVICE_NOT_READY")).toContain("temporarily unavailable");
  expect(joinErrorMessage("UNKNOWN")).toContain("Something went wrong");
 });
});
