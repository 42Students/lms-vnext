import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("learner course progress drill-down copy boundaries",()=>{
 // These new detailed routes have no one-to-one legacy page heading; preserve
 // their existing H1 while removing the newly invented eyebrow/description.
 for(const [route,title] of [["progress","Course progress by lesson"],["attendance-summary","Course attendance history"]]){
  it("preserves the drill-down title and omits unverified additional header copy",()=>{
   const source=readFileSync("src/app/(authenticated)/learn/courses/[deliveryId]/"+route+"/page.tsx","utf8");
   expect(source).toContain('<PageHeader title="'+title+'" />');
   expect(source).not.toContain("eyebrow={");
   expect(source).not.toContain("description={");
  });
 }
});
