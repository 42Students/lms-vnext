import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const files=["/mentor/activity","/mentor/calendar","/mentor/notifications","/mentor/projects","/mentor/projects/[projectId]","/mentor/projects/[projectId]/activity-history","/mentor/projects/[projectId]/board-review","/mentor/projects/[projectId]/closeout"];
describe("UX mentor cross audit mobile target batch one",()=>{
 it("UX-mentor-cross-TCH01 links and native controls provide 44px action areas",()=>{
  for(const route of files){
   const src=readFileSync("src/app/(authenticated)"+route+"/page.tsx","utf8");
   const links=[...src.matchAll(/<Link\b[^>]*?className="([^"]*)"/g)];
   for(const [,classes] of links)expect(classes,route).toContain("min-h-11");
   const fields=[...src.matchAll(/<(?:input|select)\b[^>]*?className="([^"]*)"/g)];
   for(const [,classes] of fields)expect(classes,route).toContain("min-h-11");
  }
 });
});
