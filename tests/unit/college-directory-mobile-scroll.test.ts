import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
describe("College Admin mobile tables",()=>{
 it("exposes keyboard-scrollable and mobile-annotated semester and batch results",()=>{
  const source=readFileSync(join(process.cwd(),"src/components/academics/college-academic-directory.tsx"),"utf8");
  expect(source).toContain('role="region" tabIndex={0}');
  expect(source).toContain("max-w-full overflow-x-auto");
  expect(source).toContain("sm:hidden");
  expect(source).toContain("Scroll sideways to view all semester or batch columns.");
 });
 it("exposes keyboard-scrollable and mobile-annotated class and elective results",()=>{
  const source=readFileSync(join(process.cwd(),"src/components/academics/college-structure-directory.tsx"),"utf8");
  expect(source).toContain('role="region" tabIndex={0}');
  expect(source).toContain("max-w-full overflow-x-auto");
  expect(source).toContain("sm:hidden");
  expect(source).toContain("Scroll sideways to view all class or elective columns.");
 });
});
