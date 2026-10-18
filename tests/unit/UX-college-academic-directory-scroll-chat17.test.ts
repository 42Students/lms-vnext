import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";

describe("UX-UNOWNED-GRID-11 responsive College Admin academic directories",()=>{
 const files=[
  ["college-academic-directory.tsx",["Semester","Batch","Mapped courses","Status","Actions"]],
  ["college-structure-directory.tsx",["Class","Program / batch","Academic period","Elective","Manage"]],
 ] as const;
 it.each(files)("%s preserves editing and filter actions with scroll cues", (name,words)=>{
  const source=readFileSync(join(process.cwd(),"src/components/academics",name),"utf8");
  expect(source).toContain('import { ScrollCue } from "@/components/ui/scroll-cue"');
  expect(source).toContain('<ScrollCue axis="x" label={title + " table columns"}>');
  expect(source).toContain("</table></ScrollCue>");
  expect(source).not.toContain("min-h-10");
  expect(source).toContain("min-h-11");
  expect(source).toContain("Clear filters and view all");
  expect(source).toContain("pagination");
  for(const word of words)expect(source).toContain(word);
 });
});
