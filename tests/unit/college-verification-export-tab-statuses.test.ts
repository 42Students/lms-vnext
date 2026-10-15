import {describe,it,expect} from "vitest";
import {verificationTabStatuses} from "@/modules/verification/queue-tabs";
describe("Verification export SQL status pushdown",()=>{
 it("reads only the selected tab and waiting subtype",()=>{
  expect(verificationTabStatuses("WAITING","ALL")).toEqual(["SUBMITTED","UPDATE_PENDING"]);
  expect(verificationTabStatuses("WAITING","SUBMITTED")).toEqual(["SUBMITTED"]);
  expect(verificationTabStatuses("WAITING","UPDATE_PENDING")).toEqual(["UPDATE_PENDING"]);
  expect(verificationTabStatuses("VERIFIED","ALL")).toEqual(["VERIFIED"]);
  expect(verificationTabStatuses("SENT_BACK","ALL")).toEqual(["SENT_BACK"]);
 });
});
