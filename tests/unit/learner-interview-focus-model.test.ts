import {describe,expect,it} from "vitest";
import {learnerInterviewFocusState} from "@/modules/placements/learner-interview-focus-model";
const one={applicationId:"a",roundId:"r"};
const other={applicationId:"b",roundId:"s"};
describe("interview deep link highlights scoped round",()=>{
it("highlights only a selected owned and visible round",()=>{
expect(learnerInterviewFocusState([one],[one],"a:r"))
.toEqual({highlightedKey:"a:r",hiddenByFilters:false});
expect(learnerInterviewFocusState([one],[other],"a:r"))
.toEqual({highlightedKey:"a:r",hiddenByFilters:true});
});
it("never reveals a forged round or malformed selector",()=>{
expect(learnerInterviewFocusState([one],[one],"b:s"))
.toEqual({highlightedKey:null,hiddenByFilters:false});
expect(learnerInterviewFocusState([one],[one],null).highlightedKey).toBeNull();
});
});