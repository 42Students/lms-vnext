import {describe,expect,it} from "vitest";
import {facultySelfSectionPatchSchema} from "@/modules/people/faculty-self-section-model";
describe("Faculty document API input",()=>{
 it("requires expected optimistic version and disallows identity selectors",()=>{
  expect(facultySelfSectionPatchSchema.safeParse({section:"about",value:{description:"A"}}).success).toBe(false);
  expect(facultySelfSectionPatchSchema.safeParse({section:"about",value:{description:"A"},expectedVersion:0,collegeId:"forged"}).success).toBe(false);
 });
});
