import {describe,it,expect} from "vitest";
import {mentorSearchFeedback as feedback} from
 "@/modules/projects/mentor-command-search-feedback-model";
const row={portal:"mentor",query:"alice",lookupTerm:"alice",
 pending:false,failed:false,resultCount:2};
describe("Mentor command search async state",()=>{
 it("blocks false empty while loading a new query",()=>{
  expect(feedback({...row,lookupTerm:"ali",resultCount:0})).toBe("LOADING");
  expect(feedback({...row,pending:true,resultCount:0})).toBe("LOADING");
 });
 it("distinguishes empty, failed and scoped results",()=>{
  expect(feedback({...row,resultCount:0})).toBe("EMPTY");
  expect(feedback({...row,failed:true,resultCount:0})).toBe("FAILED");
  expect(feedback(row)).toBe("RESULTS");
  expect(feedback({...row,query:"a"})).toBe("IDLE");
  expect(feedback({...row,portal:"tpo"})).toBe("IDLE");
 });
});
