import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("TPO global keyboard chords do not steal topbar record-search typing",()=>{
 it("ignores already handled events and interactive option/listbox/dialog focus",()=>{
  const code=read("src/components/tpo/tpo-keyboard-shortcuts.tsx");
  expect(code).toContain('event.defaultPrevented');
  for(const selector of ['button','a','[role="option"]','[role="listbox"]',
   '[data-slot="dialog"]','[data-slot="drawer"]','[data-slot="popover"]']){
   expect(code).toContain(selector);
  }
  expect(code).toContain("prefix.current=null;\n    return;");
  expect(code.indexOf("inInteractiveSurface")).toBeLessThan(code.indexOf('if(event.key==="?"'));
 });
 it("retains keyboard help and unmodified G/N go and create chords",()=>{
  const code=read("src/components/tpo/tpo-keyboard-shortcuts.tsx");
  expect(code).toContain('if(event.key==="?")');
  expect(code).toContain('if(k==="g"||k==="n")');
  expect(code).toContain('prefix.current==="g"?go:make');
  expect(code).toContain('event.key==="Escape"');
  expect(code).toContain('router.push(link)');
 });
});
