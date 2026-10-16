import {describe,expect,it} from "vitest";
import {effectiveTpoVerifierSetting,tpoVerifierGrantAllowed} from "@/modules/verification/switch-state";
describe("TPO-requests-verification-20 legacy permission default",()=>{
 it("opens for active TPO by default when college setting and per-user grant are absent",()=>{
  expect(effectiveTpoVerifierSetting(undefined)).toBe(true);
  expect(tpoVerifierGrantAllowed(undefined)).toBe(true);
 });
 it("honors the college off switch and explicit individual revocation",()=>{
  expect(effectiveTpoVerifierSetting({enabled:false})).toBe(false);
  expect(effectiveTpoVerifierSetting({enabled:true})).toBe(true);
  expect(tpoVerifierGrantAllowed({revokedAt:new Date("2026-01-02")})).toBe(false);
  expect(tpoVerifierGrantAllowed({revokedAt:null})).toBe(true);
 });
});
