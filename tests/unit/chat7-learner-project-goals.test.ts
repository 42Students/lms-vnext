import {describe,expect,it} from "vitest";
import {projectTemplateBlueprintSchema} from "@/modules/projects/validation";
import {learnerProjectGoalSummary} from "@/modules/projects/learner-project-goals-model";
describe("L22-002 authored project goal and deliverables",()=>{
  it("does not invent outcomes from missing authoring",()=>{
    const blueprint=projectTemplateBlueprintSchema.parse({});
    expect(learnerProjectGoalSummary(blueprint)).toEqual({
      goal:null,description:null,deliverables:[],
    });
  });
  it("preserves the authored template version content",()=>{
    const blueprint=projectTemplateBlueprintSchema.parse({overview:{
      goal:"Complete API",description:"Follow the agreed contract",
      deliverables:["Release","Unit tests"],
    }});
    expect(learnerProjectGoalSummary(blueprint)).toEqual({
      goal:"Complete API",description:"Follow the agreed contract",
      deliverables:["Release","Unit tests"],
    });
  });
});
