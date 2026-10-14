import { describe, expect, it } from "vitest";
import {
  buildLearnerPreparationChecklist, learnerPreparationHref, learnerPreparationQuerySchema,
} from "@/modules/placements/learner-preparation-model";

const signals={
  hasEnrollment:true,hasContact:false,hasSkills:true,applicationCount:2,
};
describe("Learner placement preparation evidence checklist",()=>{
  it("shows factual evidence without a subjective readiness score",()=>{
    const data=buildLearnerPreparationChecklist(signals,{view:"ALL"});
    expect(data).toMatchObject({recorded:3,missing:1,total:4,applicationCount:2});
    expect(data.items.map(item=>[item.id,item.recorded])).toEqual([
      ["enrollment",true],["contact",false],["skills",true],["applications",true],
    ]);
    expect(Object.keys(data)).not.toContain("eligible");
    expect(Object.keys(data)).not.toContain("ready");
  });
  it("supports recorded and missing filters while preserving real counts",()=>{
    const recorded=buildLearnerPreparationChecklist(signals,{view:"RECORDED"});
    expect(recorded.items.map(item=>item.id)).toEqual(["enrollment","skills","applications"]);
    const missing=buildLearnerPreparationChecklist(signals,{view:"MISSING"});
    expect(missing.items.map(item=>item.id)).toEqual(["contact"]);
    expect(missing.total).toBe(4);
    expect(buildLearnerPreparationChecklist({
      hasEnrollment:false,hasContact:false,hasSkills:false,applicationCount:0,
    },{view:"RECORDED"}).items).toEqual([]);
  });
  it("strictly rejects caller-supplied tenant or identity selectors",()=>{
    expect(learnerPreparationQuerySchema.safeParse({}).success).toBe(true);
    expect(learnerPreparationQuerySchema.safeParse({view:"MISSING"}).success).toBe(true);
    expect(learnerPreparationQuerySchema.safeParse({view:"READY"}).success).toBe(false);
    expect(learnerPreparationQuerySchema.safeParse({collegeId:"foreign"}).success).toBe(false);
    expect(learnerPreparationQuerySchema.safeParse({membershipId:"foreign"}).success).toBe(false);
  });
  it("links only to the predefined filters",()=>{
    expect(learnerPreparationHref({view:"ALL"})).toBe("/learn/my-placements/preparation");
    expect(learnerPreparationHref({view:"MISSING"}))
      .toBe("/learn/my-placements/preparation?view=MISSING");
  });
});
