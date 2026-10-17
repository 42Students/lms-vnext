import {describe,expect,it} from "vitest";
import {emptyLearnerProfileDocument,learnerProfileDocumentSchema} from "@/modules/people/profile-validation";
import {learnerProfileChecklist} from "@/modules/people/learner-profile-checklist";
import {learnerProfileCareerCoverage} from "@/modules/people/learner-profile-career-coverage-model";
describe("optional identity excluded from career profile score",()=>{
  it("permits full non-sensitive coverage without collecting Aadhaar/PAN",()=>{
    const sections=learnerProfileChecklist(emptyLearnerProfileDocument).items;
    const filled=sections.map(x=>({...x,completed:x.section!=="identity"}));
    expect(learnerProfileCareerCoverage({items:filled})).toMatchObject({
      completed:15,total:15,percentage:100,next:null,optionalIdentityCompleted:false});
  });
  it("recommends the first genuinely missing editable section",()=>{
    const doc=learnerProfileDocumentSchema.parse({headline:"Career learner"});
    const result=learnerProfileCareerCoverage(learnerProfileChecklist(doc));
    expect(result).toMatchObject({completed:1,total:15,percentage:0});
    expect(result.next?.section).toBe("personal-details");
  });
});
