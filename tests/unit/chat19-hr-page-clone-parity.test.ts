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
 it("shares legacy controls and title chrome: activity",()=>assertClonedPage("activity"));
 it("shares legacy controls and title chrome: calendar",()=>assertClonedPage("calendar"));
 it("shares legacy controls and title chrome: colleges",()=>assertClonedPage("colleges"));
 it("shares legacy controls and title chrome: company",()=>assertClonedPage("company"));
 it("shares legacy controls and title chrome: company/reports",()=>assertClonedPage("company/reports"));
 it("shares legacy controls and title chrome: conversations/[threadId]",()=>assertClonedPage("conversations/[threadId]"));
 it("shares legacy controls and title chrome: conversations",()=>assertClonedPage("conversations"));
 it("shares legacy controls and title chrome: drives/[jobId]/interview-slots",()=>assertClonedPage("drives/[jobId]/interview-slots"));
 it("shares legacy controls and title chrome: drives/[jobId]/messages",()=>assertClonedPage("drives/[jobId]/messages"));
 it("shares legacy controls and title chrome: drives/[jobId]/rounds/editor",()=>assertClonedPage("drives/[jobId]/rounds/editor"));
 it("shares legacy controls and title chrome: drives/[jobId]/rounds/editor/remove/[roundId]",()=>assertClonedPage("drives/[jobId]/rounds/editor/remove/[roundId]"));
});
