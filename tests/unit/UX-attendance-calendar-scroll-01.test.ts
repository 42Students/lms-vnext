import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("UX-attendance-calendar-scroll-01 large variable-width attendance calendar",()=>{
 for(const [name,label] of [["admin-attendance-workspace","College attendance monthly grid"],["faculty-attendance-workspace","Faculty attendance monthly grid"]] as const){
  it(`${name} preserves learner/day/mark grid with truthful horizontal scroll fades`,()=>{
   const src=read("src/components/attendance/"+name+".tsx");
   expect(src).toContain("<ScrollCue");
   expect(src).toContain('axis="x"');
   expect(src).toContain(`label="${label}"`);
   expect(src).toContain('sticky left-0');
   expect(src).toContain("<table");
   expect(src).toContain("</ScrollCue>");
   const cue=read("src/components/ui/scroll-cue.tsx");
   expect(cue).toContain("overflow-x-auto overscroll-x-contain");
   expect(cue).toContain("node.scrollWidth - node.clientWidth");
  });
 }
 it("shared scroll primitives expose focusable keyboard regions only on actual overflow",()=>{
  const src=read("src/components/ui/scroll-cue.tsx");
  expect(src).toContain("data-scroll-fade");
  expect(src).toContain("node.scrollWidth - node.clientWidth");
  expect(src).toContain("role={edges.scrollable");
  expect(src).toContain("tabIndex={edges.scrollable ? 0 : -1}");
  expect(src).toContain("overscroll-x-contain");
 });
});
