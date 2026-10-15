import {describe,it,expect} from "vitest";
import {createProjectResourceInputSchema,updateProjectResourceInputSchema} from "@/modules/projects/validation";
import {readFileSync} from "node:fs";
const read=(n:string)=>readFileSync(new URL("../../src/modules/projects/"+n,import.meta.url),"utf8");
describe("PR-S2-11 SQL scoped resource visibility",()=>{
  it("only allows registered resource visibility values",()=>{
    expect(createProjectResourceInputSchema.safeParse({title:"A",description:"Text",visibility:"MENTOR_ONLY"}).success).toBe(true);
    expect(updateProjectResourceInputSchema.safeParse({visibility:"PUBLIC"}).success).toBe(false);
  });
  it("filters both independent link/notes read paths at the database boundary",()=>{
    expect(read("instance-service.ts")).toContain('eq(projectResources.visibility, "TEAM")');
    expect(read("resource-service.ts")).toContain('eq(projectResources.visibility, "TEAM")');
    expect(read("resource-service.ts")).toContain('visibility: input.visibility ?? "TEAM"');
  });
});
