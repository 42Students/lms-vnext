import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const file=(path:string)=>readFileSync(path,"utf8");
describe("Tracker document title and heading parity",()=>{
 it("SA-placements-projects-123 restores audit findings heading and all legacy tracker document titles",()=>{
  const root="src/app/(authenticated)/tracker/";
  expect(file(root+"page.tsx")).toContain('Report Issue · 42 Tracker');
  expect(file(root+"issues/page.tsx")).toContain('Issues · 42 Tracker');
  for(const path of ["issues/[publicId]/page.tsx","audit-findings/[publicId]/page.tsx"]){
   expect(file(root+path)).toContain('publicId+" · 42 Tracker"');
  }
  const board=file(root+"audit-findings/page.tsx");
  expect(board).toContain('title="Audit findings"');
  expect(board).toContain('title:"Audit findings · 42 Tracker"');
  expect(board).not.toContain("last synced");
 });
});
