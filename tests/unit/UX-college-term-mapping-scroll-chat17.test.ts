import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";

describe("UX-UNOWNED-GRID-09 college semester mapping remains keyboard- and touch-accessible",()=>{
 it("maintains drag-to-reorder and button alternatives without sub-44px targets",()=>{
  const source=readFileSync(join(process.cwd(),
   "src/components/academics/college-term-mapping-manager.tsx"),"utf8");
  expect(source.startsWith('"use client";')).toBe(true);
  expect(source).toContain('import { ScrollCue } from "@/components/ui/scroll-cue"');
  expect(source).toContain('<ScrollCue axis="x" label="Semester course mappings">');
  expect(source).toContain('draggable={!pending}');
  expect(source).toContain('onDragStart=');
  expect(source).toContain('onDrop=');
  expect(source).toContain('aria-label={"Move " + row.courseName + " up"}');
  expect(source).toContain('aria-label={"Move " + row.courseName + " down"}');
  expect(source).toContain('TERM_MAPPING_COPY.columns.actions');
  expect(source).toContain('<ConfirmDialog');
  expect(source).toContain('collegeTermCourseUpdateSchema');
  expect(source).not.toContain("min-h-9");
  expect(source).toContain("min-h-11");
 });
});
