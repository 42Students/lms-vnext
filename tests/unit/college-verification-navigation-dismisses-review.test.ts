import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("College verification queue navigation",()=>{
 it("closes old learner private details before moving to a new queue URL",()=>{
  const code=readFileSync("src/components/verification/CollegeVerificationPanel.tsx","utf8");
  expect(code).toMatch(/function navigate\(patch:Record<string,string>\)\s*\{\s*if\(!canNavigateCollegeVerificationQueue\(bulkBusy\)\)return;\s*setSelected\(null\)/);
  expect(code).toContain('router.push("/college/verification?"');
 });
});
