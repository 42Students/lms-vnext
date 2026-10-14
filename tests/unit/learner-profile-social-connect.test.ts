import {describe,expect,it} from "vitest";
import {learnerProfileSocialFocusField} from "@/modules/people/learner-profile-social-connect-model";
describe("learner connect-account deep-link target",()=>{
 it("focuses a known social field only for the validated social section",()=>{
  expect(learnerProfileSocialFocusField("social-profiles")).toBe("linkedinUrl");
  expect(learnerProfileSocialFocusField("identity")).toBeNull();
  expect(learnerProfileSocialFocusField("contacts")).toBeNull();
  expect(learnerProfileSocialFocusField(null)).toBeNull();
 });
});
