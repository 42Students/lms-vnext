import {describe,expect,it} from "vitest";
import {parseWorkspaceBrief,translateLegacyWorkspaceOverview} from "@/modules/projects/workspace-brief-model";

describe("legacy project overview migration",()=>{
 it("preserves authored brief content even if trusted source carries old tenant metadata",()=>{
  const record={collegeId:"source-college",organizationId:"source-organization",
   membershipId:"source-membership",
   overview:{goal:"Restore lessons",deliverables:["Release prototype"],
    definitionOfDone:["Project approved"],personas:["Students"],
    historicalFact:"Keep this"},
   localFlag:"preserved"};
  expect(parseWorkspaceBrief(record)).toMatchObject({
   goal:"Restore lessons",deliverables:["Release prototype"],
   completionConditions:["Project approved"],personas:["Students"]});
  const migrated=translateLegacyWorkspaceOverview(record);
  expect(migrated.brief.goal).toBe("Restore lessons");
  expect(migrated.opaqueFacts).toMatchObject({
   historicalFact:"Keep this",localFlag:"preserved"});
  expect(migrated.opaqueFacts).not.toHaveProperty("collegeId");
  expect(migrated.opaqueFacts).not.toHaveProperty("organizationId");
  expect(migrated.opaqueFacts).not.toHaveProperty("membershipId");
 });
 it("honors deliberately cleared native completion conditions over old definitionOfDone",()=>{
  const original={overview:{definitionOfDone:["Legacy signed off"]},
    completionConditions:[],deliverables:[],goal:"",description:""};
  expect(parseWorkspaceBrief(original).completionConditions).toEqual([]);
 });
});
