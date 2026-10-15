import {expect,it} from "vitest";
import {isCampaignTemplateKey} from "@/modules/messaging/template-boundary-model";
it("blocks authentication and reset templates from recruiter campaigns",()=>{
 for(const key of ["login-otp","auth:verify","reset.password","PASSWORD-RESET","otp"])
  expect(isCampaignTemplateKey(key)).toBe(false);
 expect(isCampaignTemplateKey("placement-notice-v1")).toBe(true);
 expect(isCampaignTemplateKey("recruiter.invite")).toBe(true);
 expect(isCampaignTemplateKey("notice token")).toBe(false);
});
