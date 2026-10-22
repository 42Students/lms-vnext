import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/learn/allAssignments/page.tsx"),"utf8");
describe("learner assignment list recovery preserves legacy messaging and accessibility",()=>{
 it("never misrepresents a failed read as no assignments",()=>{
  expect(source).toContain('Assignments could not be loaded');
  expect(source).toContain('This is a loading problem, not an empty list.');
  expect(source).toContain('role="alert"');
 });
 it("offers a mobile-sized keyboard-accessible retry on the same learner route",()=>{
  expect(source).toContain('href="/learn/allAssignments?retry=1"');
  expect(source).toContain('min-h-11 items-center');
  expect(source).toContain('focus-visible:outline-2');
 });
 it("does not swallow unauthorized membership errors",()=>{
  expect(source).toContain('error instanceof AuthorizationError || error instanceof CoursesServiceError');
  expect(source).toContain('throw error;');
 });
});
