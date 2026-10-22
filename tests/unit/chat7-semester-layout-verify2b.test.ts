import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";

describe("Semester legacy responsive layout",()=>{
 it("stacks form and directory on small screens and uses a 10/14 card split at lg",()=>{
   const src=readFileSync("src/app/(authenticated)/admin/semesters/page.tsx","utf8");
   expect(src).toContain("grid-cols-1 items-start");
   expect(src).toContain("lg:grid-cols-[minmax(0,10fr)_minmax(0,14fr)]");
   expect(src.indexOf("<CollegeSemesterCreateForm")).toBeLessThan(src.indexOf('aria-label="Semesters"'));
   expect(src).toContain('<Pagination label="Semester pages"');
 });
});
