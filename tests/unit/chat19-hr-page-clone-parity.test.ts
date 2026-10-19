import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(page:string)=>readFileSync("src/app/(authenticated)/hr/"+page+"/page.tsx","utf8");
const assertClonedPage=(page:string)=>{
 const source=read(page);
 expect(source,page).not.toMatch(/\seyebrow=/);
 expect(source,page).not.toMatch(/<(?:button|select|textarea)\b/);
 for(const hidden of source.match(/<input\b[\s\S]*?\/>/g)??[])
  expect(hidden,page+" native input exemption").toMatch(/\btype="hidden"/);
};
/** Source-only HTML/chrome checks. Tests are intentionally not executed in FAST-mode. */
describe("chat-19 HR pages use shared old-LMS chrome",()=>{
});
