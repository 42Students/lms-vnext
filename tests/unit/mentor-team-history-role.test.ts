import {describe,expect,it} from "vitest";
import {mentorTeamHistoryQuerySchema,mentorTeamHistoryHref}
 from "@/modules/projects/mentor-team-history-model";
const projectId="00000000-0000-4000-8000-000000000001";
describe("Mentor team history registered role selection",()=>{
 it("restricts role filters and retains them in pager links",()=>{
  const q=mentorTeamHistoryQuerySchema.parse({
   projectId,view:"ENDED",role:"MENTOR",page:2,
  });
  expect(mentorTeamHistoryHref(projectId,q)).toContain("role=MENTOR");
  expect(mentorTeamHistoryQuerySchema.safeParse({...q,role:"ADMIN"}).success)
   .toBe(false);
  expect(mentorTeamHistoryQuerySchema.safeParse({...q,collegeId:projectId}).success)
   .toBe(false);
 });
});
