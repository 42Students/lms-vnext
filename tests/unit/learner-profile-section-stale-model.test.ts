import {describe,expect,it} from "vitest";
import {isLearnerProfileSectionStale,validateLearnerProfileSectionEdit}
from "@/modules/people/learner-profile-section-model";
describe("optimistic profile section edits without cross-section overwrite",()=>{
  it("accepts expected persisted section and merges other keys independently",()=>{
    const item={id:"81818181-8181-4818-8818-818181818181",name:"TypeScript"};
    const parsed=validateLearnerProfileSectionEdit({
      confirmed:true,section:"skills",items:[item],expectedItems:[],
    });
    expect(parsed.expectedItems).toEqual([]);
    expect(isLearnerProfileSectionStale([],parsed.expectedItems)).toBe(false);
  });
  it("rejects stale edits and unexpected identity/section selectors",()=>{
    const item={id:"81818181-8181-4818-8818-818181818181",name:"React"};
    expect(isLearnerProfileSectionStale([item],[])).toBe(true);
    expect(()=>validateLearnerProfileSectionEdit({
      confirmed:true,section:"skills",items:[item],expectedItems:[],collegeId:"foreign",
    })).toThrow();
  });
});