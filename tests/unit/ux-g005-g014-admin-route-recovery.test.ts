import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

/** Source guards supplement—not replace—rendered desktop/mobile acceptance. */
const checks: Array<[string,string,string[]]> = [
 ["UX-G005","academics/sections/[sectionId]/error.tsx",['homeHref="/admin/academics"',"reset={reset}"]],
 ["UX-G006","audit/error.tsx",["No empty or partial history is shown","onClick={reset}",'href="/admin"']],
 ["UX-G007","colleges/[collegeId]/admins/[userId]/history/page.tsx",["Previous 100 events, page ","Next 100 events, page ","data.truncated"]],
 ["UX-G008","colleges/[collegeId]/signin/page.tsx",['policy.kind==="MIGRATION_PENDING"?<Alert tone="warning">',"saving is disabled",'ready={policy.kind!=="MIGRATION_PENDING"']],
 ["UX-G009","course-progress/students/page.tsx",["const invalidPage=","const invalidPageSize=","const invalidSort=",'title="Invalid progress filters"']],
 ["UX-G010","features/[collegeId]/history/page.tsx",['title="Invalid history link"',"collegePolicyHistoryHref(collegeId,null)","if(!result)notFound()"]],
 ["UX-G011","features/[collegeId]/trace/page.tsx",['title="Invalid learner search link"',"adminModuleTraceHref(collegeId)","if (!result)"]],
 ["UX-G012","lecture-halls/[hallId]/page.tsx",['title="Invalid date range"','"/admin/lecture-halls/"+encodeURIComponent(hallId)',"requireSuperAdminSelectedCollege"]],
 ["UX-G013","people/directory/[membershipId]/audit/page.tsx",["error instanceof AuthorizationError","throw error","Retry membership audit","if(!data)notFound()"]],
 ["UX-G014","placements/calendar/page.tsx",['href="/admin/colleges"',"if (!collegeId)",'requireSuperAdminSelectedCollege(context,"placements.read")']],
];

describe("Super Admin UX-G005–G014 scoped recovery source regressions",()=>{
 for(const [group,path,patterns] of checks){
  it(group+" preserves recoverable navigation and privacy guard",()=>{
   const source=readFileSync("src/app/(authenticated)/admin/"+path,"utf8");
   for(const pattern of patterns) expect(source,group+" missing "+pattern).toContain(pattern);
   if(group==="UX-G005"||group==="UX-G006") expect(source).not.toContain("error.message");
  });
 }
 it("UX-G009 validates filters before reading student progress",()=>{
  const s=readFileSync("src/app/(authenticated)/admin/course-progress/students/page.tsx","utf8");
  expect(s.indexOf('title="Invalid progress filters"'))
   .toBeLessThan(s.indexOf("getSuperAdminStudentCourseProgress(context"));
 });
});
