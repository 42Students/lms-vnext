import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx"),"utf8");
describe("/college/projects/templates/[templateId] UX",()=>{
 it("UX-college-projects-template-detail-01 preserves responsive or failure recovery contract",()=>expect(source).toContain("aria-label=\"Template information\""));
 it("UX-college-projects-template-detail-02 preserves responsive or failure recovery contract",()=>{
  expect(source).toContain("min-h-11");
  expect(source).toContain('title="Template could not be loaded"');
  expect(source).toContain("Use this template unavailable");
 });
});
