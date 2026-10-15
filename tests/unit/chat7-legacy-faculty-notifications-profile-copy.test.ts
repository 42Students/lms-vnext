import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Faculty Notifications and Profile legacy page headings",()=>{
 for(const [route,title] of [["notifications","Notifications"],["profile","Profile"]]){
  it("matches the exact legacy "+title+" page heading",()=>{
   const page=readFileSync("src/app/(authenticated)/teacher/"+route+"/page.tsx","utf8");
   expect(page).toContain('title="'+title+'"');
   expect(page).not.toContain('eyebrow="Faculty"');
   expect(page).not.toContain("Course workflow updates and college announcements that need your attention.");
   expect(page).not.toContain("Your college identity and teaching details.");
  });
 }
});
