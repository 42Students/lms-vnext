import {describe,expect,it} from "vitest";
import {filterLearnerScheduleSections} from "@/modules/academics/learner-schedule-section-filter-model";
const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
const rows=[{id:"first",sectionId:a},{id:"second",sectionId:b}];
describe("learner Class Schedule section filter",()=>{
  it("limits only the already authorized event collection",()=>{
    expect(filterLearnerScheduleSections(rows,a)).toEqual([rows[0]]);
    expect(filterLearnerScheduleSections(rows,b)).toEqual([rows[1]]);
    expect(filterLearnerScheduleSections(rows,"00000000-0000-4000-8000-000000000003")).toEqual([]);
  });
  it("invalid input returns the authorized all-sections view",()=>{
    expect(filterLearnerScheduleSections(rows,"../../foreign")).toEqual(rows);
  });
});
