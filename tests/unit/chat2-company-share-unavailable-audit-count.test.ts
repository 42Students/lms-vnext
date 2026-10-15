import {describe,it,expect} from "vitest";
import {companyShareAuditAvailability} from "../../src/modules/placements/company-share/audit-page-model";
describe("company-share registered audit availability",()=>{
 it("distinguishes unavailable storage from a genuinely empty audit",()=>{
  expect(companyShareAuditAvailability(false,0)).toEqual({kind:"UNAVAILABLE",total:null});
  expect(companyShareAuditAvailability(true,0)).toEqual({kind:"READY",total:0});
 });
});
