import {describe,expect,it} from "vitest";
import {recruiterConversationPulseColleges} from
  "@/modules/placements/recruiter-conversation-pulse-scope-model";

describe("recruiter conversations selected-college pulse scope",()=>{
  it("limits a selected college to the caller's current recruiter grants",()=>{
    expect(recruiterConversationPulseColleges(["a","b"],"b")).toEqual(["b"]);
    expect(recruiterConversationPulseColleges(["a","b"],"foreign")).toBeNull();
  });
  it("does not increase scope from repeated grants or missing access",()=>{
    expect(recruiterConversationPulseColleges(["a","a","b"])).toEqual(["a","b"]);
    expect(recruiterConversationPulseColleges([])).toEqual([]);
    expect(recruiterConversationPulseColleges([],"a")).toBeNull();
  });
  it("does not mutate grant order",()=>{
    const grants=["b","a","b"];
    expect(recruiterConversationPulseColleges(grants)).toEqual(["b","a"]);
    expect(grants).toEqual(["b","a","b"]);
  });
});
