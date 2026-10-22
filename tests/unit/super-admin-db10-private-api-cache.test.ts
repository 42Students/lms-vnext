import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const paths=[
 "src/app/api/announcements/admin/route.ts",
 "src/app/api/tracker/issues/route.ts",
 "src/app/api/tracker/issues/[publicId]/route.ts",
];
describe("private DB10 admin reads",()=>{
 it.each(paths)("returns no-store on %s",path=>{
  const source=readFileSync(path,"utf8");
  if(path.includes("/announcements/")) {
   expect(source).toContain('}:page,{headers:{"cache-control":"private, no-store"}});');
  }else {
   expect(source).toMatch(/return NextResponse\.json\((page|issue),\s*\{\s*headers:\s*\{\s*"cache-control":\s*"private, no-store"/);
  }
 });
});
