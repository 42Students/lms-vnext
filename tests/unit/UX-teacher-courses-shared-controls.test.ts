import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=()=>readFileSync(join(process.cwd(),"src/components/courses/faculty-course-list.tsx"),"utf8");
describe("Shared Faculty Courses controls",()=>{
 it("UX-teacher-courses-shared-03 uses a single shared labelled form pattern for both faculty course entry points",()=>{
  const page=source();
  expect(page).toContain('import { Input } from "@/components/ui/input"');
  expect(page).toContain('import { Select } from "@/components/ui/select"');
  expect(page).toContain('import { Button } from "@/components/ui/button"');
  expect(page).toContain('<Input name="q" type="search"');
  for(const key of ["period","role"])expect(page).toContain('<Select name="'+key+'"');
  expect(page).toContain('<Select aria-label="Filter by section" name="section"');
  expect(page).toContain('<noscript><Button type="submit" variant="primary"');
  expect(page).toContain("Apply filters</Button></noscript>");
  expect(page).not.toContain('<select name=');
  expect(page).not.toContain('text-on-primary');
 });
 it("UX-teach-courses-shared-03 keeps exact learner-safe empty copy and keyboard-reachable Section shortcuts",()=>{
  const page=source();
  expect(page).toContain("No teaching assignments found. Please contact your administrator.");
  expect(page).toContain("min-h-11 items-center text-[var(--lms-teal-deep)] underline");
  expect(page).toContain("facultyCourseListHref({...query,page:pagination.page+1})");
 });
});
