import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {recruiterDriveListQuerySchema,recruiterDrivesHref} from "@/modules/placements/recruiter-drive-list-model";
describe("Final sprint recruiter legacy drive list bookmarks",()=>{
 it("REC-home-drives-R06 legacy tab query alias maps live waiting closed and all without changing q",()=>{
  const source=readFileSync("src/app/(authenticated)/hr/drives/page.tsx","utf8");
  for(const [legacy,canonical] of [["all","ALL"],["live","LIVE"],["waiting","WAITING"],["closed","CLOSED"]]){
   expect(source).toContain('case "'+legacy+'":return "'+canonical+'";');
   expect(recruiterDriveListQuerySchema.parse({view:canonical,q:"Engineer"}).view).toBe(canonical);
  }
  expect(source).toContain('view: first(raw.view) || legacyDriveTab(first(raw.tab))');
  expect(source).toContain('q: first(raw.q) || undefined');
  expect(recruiterDriveListQuerySchema.safeParse({view:"WRONG"}).success).toBe(false);
  const href=recruiterDrivesHref(recruiterDriveListQuerySchema.parse({view:"LIVE",q:"Engineer"}));
  expect(href).toContain("view=LIVE");
  expect(href).toContain("q=Engineer");
 });
});
