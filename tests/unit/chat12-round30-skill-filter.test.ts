import {describe,it,expect} from "vitest";
import {tpoProfileSkillNameMatches} from "@/modules/placements/tpo-hidden-profile-search";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("TPO Students full profile facets",()=>{
 it("TPO-students-22 accepts a separate server-only skill-name filter, distinct from minimum skill count",()=>{
  const doc={skills:[{name:"Spring Boot"},{name:"Java"}],identity:{aadhaarNumber:"123"}};
  expect(tpoProfileSkillNameMatches(doc,"spring")).toBe(true);
  expect(tpoProfileSkillNameMatches(doc,"python")).toBe(false);
  const service=src("src/modules/placements/tpo-students-service.ts");
  const model=src("src/modules/placements/tpo-students-model.ts");
  expect(service).toContain("skillName:z.string().trim().min(1).max(100).optional()");
  expect(model).toContain("row.skillNameMatched===true");
  expect(src("src/app/(authenticated)/tpo/students/page.tsx")).toContain('name="skillName"');
 });
 it("TPO-students-22 preserves skill filtering through exports and view links",()=>{
  const page=src("src/app/(authenticated)/tpo/students/page.tsx");
  expect(page).toContain('if(filters.skillName)params.set("skillName",filters.skillName)');
  expect(page).toContain("skillName:query.skillName");
  expect(src("src/modules/placements/tpo-students-url-guard.ts")).toContain('"skillName"');
 });
});
