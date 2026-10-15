import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Learner Profile, Notifications and Projects legacy list headings",()=>{
 for(const [route,title] of [["profile","Profile"],["notifications","Notifications"],["projects","Projects"]]){
  it("keeps "+title+" verbatim and has no vNext-only list subtitle",()=>{
   const src=readFileSync("src/app/(authenticated)/learn/"+route+"/page.tsx","utf8");
   expect(src).toContain('title="'+title+'"');
   expect(src).not.toContain('eyebrow="Learner"');
   expect(src).not.toMatch(/description="Your (academic|course|active Project)/);
  });
 }
});
