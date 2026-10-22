import {describe,it,expect} from "vitest";
import {projectTemplateLegacyDto} from "@/modules/projects/legacy-template-dto-model";
describe("legacy template DTO remains non-authoritative",()=>{
 it("preserves historic labels and does not invent a legacy identity",()=>{
  const at=new Date("2026-10-22T12:00:00.000Z");
  expect(projectTemplateLegacyDto({
   slug:"example",title:"Example",summary:null,legacyCourseLabel:"CS",
   legacyPhase:"SPRINT",status:"PUBLISHED",currentVersion:2,
   createdAt:at,updatedAt:at,
  })).toMatchObject({
   id:null,courseLabel:"CS",phase:"SPRINT",version:2,
   publishedAt:null,organizationId:null,collegeId:null,createdById:null,
  });
 });
});
