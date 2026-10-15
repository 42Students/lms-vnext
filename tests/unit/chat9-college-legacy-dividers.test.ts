import {describe,expect,it} from "vitest";
import {existsSync} from "node:fs";
import {join} from "node:path";
import {collegeAdminItems} from "@/components/shell/shell-model";
describe("College Admin exact legacy navigation landing and separators",()=>{
 it("lands People on Faculty, preserving the Directory as its own tab",()=>{
  const row=collegeAdminItems.find(x=>x.label==="People");
  expect(row?.href).toBe("/college/faculty");
  expect(existsSync(join(process.cwd(),"src/app/(authenticated)/college/faculty/page.tsx"))).toBe(true);
 });
 it("places the three separators after Activity Log, People and Projects",()=>{
  const starts=collegeAdminItems.flatMap((item,index)=>
   index>0&&item.group!==collegeAdminItems[index-1]!.group?[index]:[]);
  expect(starts).toEqual([2,5,9]);
  expect(starts.map(i=>collegeAdminItems[i-1]!.label))
   .toEqual(["Activity Log","People","Projects"]);
 });
});
