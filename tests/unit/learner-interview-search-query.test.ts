import {describe,expect,it} from "vitest";
import {learnerRoundSearchFromQuery,learnerRoundSearchHref} from "@/modules/placements/learner-round-search-query-model";
import {learnerInterviewViewHref,learnerInterviewScheduleViewSchema}
  from "@/modules/placements/learner-interview-view-model";
describe("shareable interview search and view query",()=>{
  it("preserves own round and the selected past view alongside the search",()=>{
    const route=learnerInterviewViewHref(
      "/learn/my-placements/interviews?applicationId=own&roundId=owned","past");
    const url=learnerRoundSearchHref(route,"  engineer  ");
    const query=new URL(url,"https://lms.invalid").searchParams;
    expect(query.get("view")).toBe("past");
    expect(query.get("applicationId")).toBe("own");
    expect(query.get("roundId")).toBe("owned");
    expect(learnerRoundSearchFromQuery({q:query.get("q")})).toBe("engineer");
    expect(learnerInterviewScheduleViewSchema.parse(query.get("view"))).toBe("past");
  });
  it("rejects forged or unbounded search input rather than selecting another college",()=>{
    for(const raw of [{q:["foreign"]},{q:"x".repeat(101)},{q:"valid",collegeId:"other"}])
      expect(()=>learnerRoundSearchFromQuery(raw)).toThrow();
  });
});
