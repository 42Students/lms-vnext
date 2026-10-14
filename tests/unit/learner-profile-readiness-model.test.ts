import {describe,expect,it} from "vitest";
import {emptyLearnerProfileDocument,learnerProfileDocumentSchema} from "@/modules/people/profile-validation";
import {ownLearnerProfileReadiness} from "@/modules/people/learner-profile-readiness-model";
describe("read-only persisted learner profile coverage",()=>{
  it("reports missing without inventing eligibility or completed records",()=>{
    const empty=ownLearnerProfileReadiness(emptyLearnerProfileDocument,{show:"missing"});
    expect(empty).toMatchObject({filled:0,missing:16,total:16,percentage:0});
    expect(empty?.items).toHaveLength(16);
  });
  it("filters only fields actually saved in the validated profile document",()=>{
    const doc=learnerProfileDocumentSchema.parse({
      headline:"Software learner",skills:[{id:"81818181-8181-4818-8818-818181818181",name:"TypeScript"}],
    });
    expect(ownLearnerProfileReadiness(doc,{show:"filled"})?.items.map(x=>x.section))
      .toEqual(["profile-introduction","skills"]);
    expect(ownLearnerProfileReadiness(doc,{show:"all"})?.filled).toBe(2);
  });
  it("rejects unsupported filters and forged tenant selectors",()=>{
    expect(ownLearnerProfileReadiness(emptyLearnerProfileDocument,{show:["missing"]})).toBeNull();
    expect(ownLearnerProfileReadiness(emptyLearnerProfileDocument,{collegeId:"another"})).toBeNull();
    expect(ownLearnerProfileReadiness(emptyLearnerProfileDocument,{show:"verified"})).toBeNull();
  });
});