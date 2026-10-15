import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("dev legacy learner timetable and attendance titles",()=>{
 for(const [route,title] of [["attendance","Attendance"],["calendar","Class Schedule"]]){
  it("renders "+title+" without invented summary or uppercase eyebrow",()=>{
   const source=readFileSync("src/app/(authenticated)/learn/"+route+"/page.tsx","utf8");
   expect(source).toContain('title="'+title+'"');
   expect(source).not.toContain('eyebrow="Learner"');
   expect(source).not.toContain("Your marked attendance, unmarked sessions and College threshold");
   expect(source).not.toContain("Your current Section schedule, Course filters and upcoming classes.");
  });
 }
});
