import {describe,expect,it} from "vitest";
import {existsSync,readFileSync} from "node:fs";
import {join} from "node:path";
import {collegeLegacyGroupForPath} from "@/modules/people/college-legacy-tabs-model";
describe("college Projects reassignment workflow entry",()=>{
 it("links the existing reassignment route from Workspaces while retaining detail access",()=>{
  const root=join(process.cwd(),"src/app/(authenticated)/college/projects");
  const src=readFileSync(join(root,"page.tsx"),"utf8");
  expect(src).toContain('href="/college/projects/reassign-mentor"');
  expect(src).toContain("Bulk reassign mentor");
  expect(existsSync(join(root,"reassign-mentor/page.tsx"))).toBe(true);
  expect(existsSync(join(root,"[projectId]/[section]/page.tsx"))).toBe(true);
  expect(collegeLegacyGroupForPath("/college/projects/reassign-mentor")?.title).toBe("Projects");
 });
});
