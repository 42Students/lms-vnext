import {describe,expect,it} from "vitest";
import {selectRecruiterWorkspaceThread} from "@/modules/placements/hr-conversation-inbox-model";
describe("Recruiter workspace thread selection",()=>{
 const a={id:"11111111-1111-4111-8111-111111111111"};
 const b={id:"22222222-2222-4222-8222-222222222222"};
 it("reads only previously authorized inbox rows",()=>{
  expect(selectRecruiterWorkspaceThread([a,b],b.id)).toEqual(b);
  expect(selectRecruiterWorkspaceThread([a,b],"33333333-3333-4333-8333-333333333333")).toEqual(a);
 });
 it("does not treat malformed or repeated identifiers as authorized",()=>{
  expect(selectRecruiterWorkspaceThread([a,b],[b.id,a.id])).toEqual(a);
  expect(selectRecruiterWorkspaceThread([a,b],"../admin")).toEqual(a);
  expect(selectRecruiterWorkspaceThread([],b.id)).toBeNull();
 });
});