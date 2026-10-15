import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const board=readFileSync("src/app/(authenticated)/tracker/audit-findings/page.tsx","utf8");
describe("audit finding optimistic edit refresh",()=>{
 it("remounts editor when server version changes",()=>{
  expect(board).toContain('key={item.publicId+":"+item.version}');
  expect(board).toContain("current={item.status}");
 });
});