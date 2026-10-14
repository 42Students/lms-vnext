import {describe,expect,it} from "vitest";
import {learnerProjectMobileFilterSummary} from "@/modules/projects/learner-project-mobile-filter-model";
describe("L20-017 compact learner Project list filters",()=>{
  it("reports actual active choices without counting default rows or page",()=>{
    expect(learnerProjectMobileFilterSummary({page:2,pageSize:25})).toEqual({
      count:0,labels:[],
    });
    expect(learnerProjectMobileFilterSummary({
      search:"alpha",status:"CURRENT",attention:"LEARNER_ACTION",pageSize:50,
    })).toEqual({count:4,labels:["Search","Current","Needs my action","50 rows"]});
  });
  it("does not invent the unsupported legacy blocker filter",()=>{
    expect(learnerProjectMobileFilterSummary({
      status:"ARCHIVED",attention:"LEARNER_ACTION",
    }).labels).toEqual(["ARCHIVED","Needs my action"]);
  });
});
