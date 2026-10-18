import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const routes=["/mentor/projects/[projectId]/team-meetings","/mentor/projects/[projectId]/timeline","/mentor/reports","/mentor/review-history","/mentor/reviews","/mentor/sprint-progress","/mentor/task-review-history","/mentor/task-reviews","/mentor/team-coverage"];
describe("UX mentor cross audit mobile target batch three",()=>{
 it("UX-mentor-cross-TCH03 review and report actions are 44px or larger",()=>{
  for(const route of routes){
   const src=readFileSync("src/app/(authenticated)"+route+"/page.tsx","utf8");
   const links=[...src.matchAll(/<Link\b[^>]*?className="([^"]*)"/g)];
   for(const [,classes] of links)expect(classes,route).toContain("min-h-11");
   const fields=[...src.matchAll(/<(?:input|select)\b[^>]*?className="([^"]*)"/g)];
   for(const [,classes] of fields)expect(classes,route).toContain("min-h-11");
  }
 });
});
