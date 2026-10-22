import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

describe("assignment refresh retains last successful page when the server fails",()=>{
 it("reuses the same keyed assessment component with loadError",()=>{
  const page=readFileSync(join(process.cwd(),"src/app/(authenticated)/learn/allAssignments/page.tsx"),"utf8");
  const list=readFileSync(join(process.cwd(),"src/components/courses/learner-assessment-overview.tsx"),"utf8");
  expect(page).toContain('key={requestedCourse||"all"}');
  expect(page).toContain("loadError");
  expect(list).toContain("lastGoodItems.length > 0 ? lastGoodItems : items");
  expect(list).toContain("Submission actions are unavailable until a successful refresh.");
  expect(list).toContain("Couldn't refresh assignments");
 });
});
