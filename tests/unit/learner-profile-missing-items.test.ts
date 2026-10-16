import {describe,it,expect} from "vitest";
import {learnerProfileMissingItems} from "@/modules/placements/learner-profile-missing-items-model";
describe("LEARNER-profile-misc-15 missing verification documents",()=>{
 it("separates educational and identity requirements without hiding entries",()=>{
  expect(learnerProfileMissingItems({education:{missing:["Add 10th education","Upload a resume"]},
   identity:{missing:["Provide Aadhaar or PAN details"]}})).toEqual([
    {section:"Education",message:"Add 10th education"},
    {section:"Education",message:"Upload a resume"},
    {section:"Identity",message:"Provide Aadhaar or PAN details"},
   ]);
 });
});
