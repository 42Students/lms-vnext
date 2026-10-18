import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const routes=["/mentor/projects/[projectId]/deliveries/[submissionId]/review","/mentor/projects/[projectId]/meetings/[meetingId]/notes","/mentor/projects/[projectId]/resources-directory","/mentor/projects/[projectId]/review-completeness","/mentor/projects/[projectId]/review-overview","/mentor/projects/[projectId]/risk-readiness","/mentor/projects/[projectId]/tasks/[taskId]/feedback","/mentor/projects/[projectId]/team-history"];
describe("UX mentor cross audit mobile target batch two",()=>{
 it("UX-mentor-cross-TCH02 confirms navigational actions remain accessible by touch",()=>{
  for(const route of routes){
   const src=readFileSync("src/app/(authenticated)"+route+"/page.tsx","utf8");
   const links=[...src.matchAll(/<Link\b[^>]*?className="([^"]*)"/g)];
   for(const [,classes] of links)expect(classes,route).toContain("min-h-11");
   const fields=[...src.matchAll(/<(?:input|select)\b[^>]*?className="([^"]*)"/g)];
   for(const [,classes] of fields)expect(classes,route).toContain("min-h-11");
  }
 });
});
