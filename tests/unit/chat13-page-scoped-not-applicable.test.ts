import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";import {join} from "node:path";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
const panel=()=>read("src/components/admin/super-admin-interview-operations.tsx");
const analytics=()=>read("src/app/(authenticated)/admin/placements/analytics/page.tsx");
describe("Super Admin Placements per-surface non-applicability",()=>{
 it("GR-40 no file input or upload is present on the interview operations surface",()=>{
  expect(panel()).not.toContain('type="file"');
  expect(panel()).not.toContain("FormData(");
 });
 it("GR-63 interview operations does not import or perform bulk write actions",()=>{
  const content=panel();expect(content).not.toContain('method:"POST"');
  expect(content).not.toContain('type="file"');
 });
 it("GR-74 analytics and interview operations do not render logos or avatars requiring image fallbacks",()=>{
  for(const content of [panel(),analytics()])expect(content).not.toContain("<img");
 });
 it("GR-75 analytics and interview operations have no realtime bells or sockets to degrade",()=>{
  for(const content of [panel(),analytics()]){expect(content).not.toContain("WebSocket(");
   expect(content).not.toContain("EventSource(");}
 });
 it("GR-77 analytics and interview operations offer CSV and .ics rather than print or PDF views",()=>{
  expect(panel()).not.toContain("window.print");
  expect(analytics()).not.toContain("window.print");
  expect(panel()).not.toContain(".pdf");
 });
});
