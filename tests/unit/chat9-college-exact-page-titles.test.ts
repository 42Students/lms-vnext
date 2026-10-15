import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const root=join(process.cwd(),"src/app/(authenticated)/college");
const cases=[
 ["profile/page.tsx","Profile",["My profile"]],
 ["videos/page.tsx","Video",["Video Content"]],
 ["lecture-halls/page.tsx","Lecture Halls",["Lecture halls"]],
 ["batch-promotion/page.tsx","Batch Promotion",["Batch Promotion Preview"]],
 ["course-progress/page.tsx","Progress",["Course Progress"]],
] as const;
describe("College Admin exact legacy page title copy",()=>{
 for(const [file,title,obsolete] of cases){
  it(file+" has exact legacy title for normal and invalid states",()=>{
   const src=readFileSync(join(root,file),"utf8");
   expect(src).toContain('title="'+title+'"');
   for(const old of obsolete)expect(src).not.toContain('title="'+old+'"');
  });
 }
});
