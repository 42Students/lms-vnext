import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";

describe("UX-UNOWNED-GRID-11 responsive College Admin academic directories",()=>{
 const files=[
  ["college-academic-directory.tsx",["Semester","Batch","Courses","Status","Actions"]],
  ["college-structure-directory.tsx",["Class","Program","Batch","Academic period","Elective","Actions"]],
 ] as const;
 it.each(files)("%s preserves editing and filter actions with scroll cues", (name,words)=>{
  const source=readFileSync(join(process.cwd(),"src/components/academics",name),"utf8");
  expect(source).toContain('import { DataTable } from "@/components/ui/data-table"');
  expect(source).toContain("<DataTable");
  const table=readFileSync(join(process.cwd(),"src/components/ui/data-table.tsx"),"utf8");
  expect(table).toContain('<ScrollCue axis="x"');
  expect(table).toContain("md:sticky md:top-0");
  expect(source).not.toContain("<table");
  expect(source).not.toContain("min-h-10");
  expect(source).toContain("min-h-11");
  expect(source).toContain("Clear filters and view all");
  expect(source).toContain("pagination");
  for(const word of words)expect(source).toContain(word);
 });
});
