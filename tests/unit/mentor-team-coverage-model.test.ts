import {describe,expect,it} from "vitest";
import {
  mentorTeamCoverageQuerySchema,summarizeActiveProjectTeam,selectMentorTeamCoverage,
} from "@/modules/projects/mentor-team-coverage-model";
describe("Mentor registered active team coverage",()=>{
 it("counts only supplied eligible active project role rows",()=>{
  expect(summarizeActiveProjectTeam([
    {role:"MENTOR",isPrimary:true},{role:"LEARNER",isPrimary:false},
  ])).toEqual({learners:1,mentors:1,hasPrimaryMentor:true});
  expect(summarizeActiveProjectTeam([])).toEqual({
    learners:0,mentors:0,hasPrimaryMentor:false,
  });
 });
 it("returns an honest 0-match filter result with distinct authorized project count",()=>{
  const rows=[{projectId:"p1",title:"Alpha",status:"ACTIVE",
    learners:2,mentors:1,hasPrimaryMentor:true,isPrimaryMentor:true}];
  const result=selectMentorTeamCoverage(rows,{
    filter:"NO_LEARNERS",status:"ALL",search:"",page:99,
  });
  expect(result).toMatchObject({total:0,items:[],page:1,totalPages:1});
  expect(selectMentorTeamCoverage(rows,{
    filter:"HAS_LEARNERS",status:"ALL",search:"",page:1,
  }).total).toBe(1);
  expect(selectMentorTeamCoverage(rows,{
    filter:"HAS_PRIMARY_MENTOR",status:"ALL",search:"",page:1,
  }).total).toBe(1);
  expect(mentorTeamCoverageQuerySchema.safeParse({collegeId:"forged"}).success).toBe(false);
  expect(mentorTeamCoverageQuerySchema.safeParse({filter:"UNTRUSTED"}).success).toBe(false);
  expect(mentorTeamCoverageQuerySchema.safeParse({status:"ARCHIVED"}).success).toBe(false);
  expect(selectMentorTeamCoverage(rows,{filter:"ALL",status:"PLANNED",search:"",page:1}).total).toBe(0);
  expect(selectMentorTeamCoverage(rows,{filter:"ALL",status:"ACTIVE",search:"",page:1}).total).toBe(1);
 });
});
