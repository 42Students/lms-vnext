import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const shared=read("src/components/ui/graceful-page-loading.tsx");
const routes=["people","programs","quizzes","resources","semester-courses","semesters","students","verification","videos"];
describe("College UX bounded directory loader",()=>{
 it("UX-college-bounded-loading-01 offers retry after 12 seconds without changing the shared card default",()=>{
  expect(shared).toContain('shape = "card"');
  expect(shared).toContain('shape === "directory"');
  expect(shared).toContain("12_000");
  expect(shared).toContain("window.location.reload()");
  expect(shared).toContain('<Button type="button" variant="secondary"');
 });
 it("UX-college-bounded-loading-02 delegates every nine College directory fallbacks to the shared bounded loader",()=>{
  for(const route of routes){
   const source=read("src/app/(authenticated)/college/"+route+"/loading.tsx");
   expect(source,route).toContain("GracefulPageLoading");
   expect(source,route).toContain('shape="directory"');
  }
 });
});
