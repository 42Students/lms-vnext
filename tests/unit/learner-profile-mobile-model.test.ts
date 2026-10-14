import {describe,expect,it} from "vitest";
import {learnerProfileChecklist} from "@/modules/people/learner-profile-checklist";
import {emptyLearnerProfileDocument} from "@/modules/people/profile-validation";
import {learnerProfileMobileQuickLinks} from "@/modules/people/learner-profile-mobile-model";
describe("profile mobile quick links",()=>{
 it("prioritizes four non-sensitive empty career sections without inventing completion",()=>{
  const list=learnerProfileMobileQuickLinks(learnerProfileChecklist(emptyLearnerProfileDocument).items);
  expect(list.map(x=>x.section)).toEqual(["profile-introduction","education","skills","projects"]);
  expect(list.every(x=>x.section!=="identity")).toBe(true);
 });
 it("drops genuinely filled entries and leaves all-filled state blank",()=>{
  const items=learnerProfileChecklist(emptyLearnerProfileDocument).items.map(x=>({...x,completed:true}));
  expect(learnerProfileMobileQuickLinks(items)).toEqual([]);
 });
});
