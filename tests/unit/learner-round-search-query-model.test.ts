import {describe,expect,it} from "vitest";
import {learnerRoundSearchFromQuery,learnerRoundSearchHref}
  from "@/modules/placements/learner-round-search-query-model";
describe("learner assessment shareable search",()=>{
  it("persists bounded searched text without dropping exact own round link",()=>{
    const url=learnerRoundSearchHref(
      "https://lms.invalid/learn/my-placements/assessments?applicationId=abc&roundId=def",
      "  Acme engineer  ",
    );
    expect(url).toContain("applicationId=abc&roundId=def");
    expect(learnerRoundSearchFromQuery({q:new URL(url,"https://lms.invalid").searchParams.get("q")}))
      .toBe("Acme engineer");
    expect(learnerRoundSearchHref("https://lms.invalid/learn/my-placements/assessments?q=abc",""))
      .toBe("/learn/my-placements/assessments");
  });
  it("rejects array inputs, excess text and forged selector fields",()=>{
    for(const raw of [{q:["one","two"]},{q:"a".repeat(101)},{q:"x",collegeId:"other"}]){
      expect(()=>learnerRoundSearchFromQuery(raw)).toThrow();
    }
  });
});
