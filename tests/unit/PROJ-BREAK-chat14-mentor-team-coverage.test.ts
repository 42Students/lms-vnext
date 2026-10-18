import {describe,expect,it} from "vitest";
import {
 mentorTeamCoverageQuerySchema,mentorTeamCoverageHref,summarizeActiveProjectTeam,
 selectMentorTeamCoverage,type MentorTeamCoverageRow,
} from "@/modules/projects/mentor-team-coverage-model";

const ids=[
 "11111111-1111-4111-8111-111111111111",
 "22222222-2222-4222-8222-222222222222",
 "33333333-3333-4333-8333-333333333333",
 "44444444-4444-4444-8444-444444444444",
];
const rows:MentorTeamCoverageRow[]=[
 {projectId:ids[0],title:"Atlas",status:"ACTIVE",learners:0,mentors:0,hasPrimaryMentor:false,isPrimaryMentor:false},
 {projectId:ids[1],title:"Beacon",status:"ACTIVE",learners:5,mentors:2,hasPrimaryMentor:true,isPrimaryMentor:true},
 {projectId:ids[2],title:"Core",status:"PLANNED",learners:1,mentors:1,hasPrimaryMentor:true,isPrimaryMentor:false},
 {projectId:ids[3],title:"Done",status:"COMPLETED",learners:0,mentors:1,hasPrimaryMentor:false,isPrimaryMentor:true},
];
const q=(raw:Record<string,unknown>={})=>mentorTeamCoverageQuerySchema.parse(raw);

describe("PROJ-BREAK-MENTOR-145..153 active roster coverage and pagination contracts",()=>{
 it("PROJ-BREAK-MENTOR-145 only active roster rows supplied by scoped service count, no inferred role",()=>{
  expect(summarizeActiveProjectTeam([
   {role:"LEARNER",isPrimary:true},{role:"MENTOR",isPrimary:false},
   {role:"MENTOR",isPrimary:true},{role:"ADMIN",isPrimary:true},
  ])).toEqual({learners:1,mentors:2,hasPrimaryMentor:true});
  expect(summarizeActiveProjectTeam([{role:"LEARNER",isPrimary:true}]).hasPrimaryMentor).toBe(false);
  expect(summarizeActiveProjectTeam([])).toEqual({learners:0,mentors:0,hasPrimaryMentor:false});
 });
 it("PROJ-BREAK-MENTOR-146 no learners and missing primary are independently counted",()=>{
  expect(selectMentorTeamCoverage(rows,q({filter:"NO_LEARNERS"})).items.map(r=>r.projectId))
   .toEqual([ids[0],ids[3]]);
  expect(selectMentorTeamCoverage(rows,q({filter:"NO_PRIMARY_MENTOR"})).items.map(r=>r.projectId))
   .toEqual([ids[0],ids[3]]);
  expect(selectMentorTeamCoverage(rows,q({filter:"NO_LEARNERS_NO_PRIMARY"})).total).toBe(2);
 });
 it("PROJ-BREAK-MENTOR-147 five-plus and multiple/single mentor facets use persisted count thresholds",()=>{
  expect(selectMentorTeamCoverage(rows,q({filter:"FIVE_PLUS_LEARNERS"})).items.map(r=>r.projectId))
   .toEqual([ids[1]]);
  expect(selectMentorTeamCoverage(rows,q({filter:"MULTIPLE_MENTORS"})).items.map(r=>r.projectId))
   .toEqual([ids[1]]);
  expect(selectMentorTeamCoverage(rows,q({filter:"SINGLE_MENTOR"})).items.map(r=>r.projectId))
   .toEqual([ids[2],ids[3]]);
 });
 it("PROJ-BREAK-MENTOR-148 primary versus supporting uses current Mentor assignment, not team aggregate",()=>{
  expect(selectMentorTeamCoverage(rows,q({assignment:"PRIMARY"})).items.map(r=>r.projectId))
   .toEqual([ids[1],ids[3]]);
  expect(selectMentorTeamCoverage(rows,q({assignment:"SUPPORTING"})).items.map(r=>r.projectId))
   .toEqual([ids[0],ids[2]]);
  expect(selectMentorTeamCoverage(rows,q({status:"PLANNED",assignment:"PRIMARY"})).total).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-149 status and substring filters do not fabricate missing work",()=>{
  const result=selectMentorTeamCoverage(rows,q({status:"ACTIVE",search:"bea"}));
  expect(result.total).toBe(1);
  expect(result.items[0].projectId).toBe(ids[1]);
  expect(selectMentorTeamCoverage(rows,q({search:"no such project"})).items).toEqual([]);
  expect(selectMentorTeamCoverage(rows,q({status:"COMPLETED"})).total).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-150 numeric ordering is deterministic even if multiple rows tie",()=>{
  expect(selectMentorTeamCoverage(rows,q({order:"FEWEST_LEARNERS"})).items.map(r=>r.projectId))
   .toEqual([ids[0],ids[3],ids[2],ids[1]]);
  expect(selectMentorTeamCoverage(rows,q({order:"MOST_MENTORS"})).items.map(r=>r.projectId))
   .toEqual([ids[1],ids[2],ids[3],ids[0]]);
  expect(selectMentorTeamCoverage(rows,q({order:"FEWEST_MENTORS"})).items[0].projectId).toBe(ids[0]);
 });
 it("PROJ-BREAK-MENTOR-151 page bounds cannot be bypassed by direct helper calls",()=>{
  expect(selectMentorTeamCoverage(rows,{...q(),page:-10}).page).toBe(1);
  expect(selectMentorTeamCoverage(rows,{...q(),page:Infinity}).page).toBe(1);
  expect(selectMentorTeamCoverage(rows,{...q(),page:99999}).page).toBe(1);
  expect(selectMentorTeamCoverage([],q()).totalPages).toBe(1);
  expect(selectMentorTeamCoverage(rows,q()).pageSize).toBe(20);
 });
 it("PROJ-BREAK-MENTOR-152 forged college/actor, unsupported statuses and enormous pages reject",()=>{
  for(const bad of [{collegeId:ids[0]},{actorId:ids[0]},{filter:"FAKE"},
   {assignment:"OWNER"},{status:"ARCHIVED"},{page:10001},{search:"x".repeat(121)}]){
   expect(mentorTeamCoverageQuerySchema.safeParse(bad).success).toBe(false);
  }
 });
 it("PROJ-BREAK-MENTOR-153 hrefs retain current filter values, never tenant/role data",()=>{
  const href=mentorTeamCoverageHref(q({
   filter:"NO_PRIMARY_MENTOR",status:"ACTIVE",assignment:"SUPPORTING",
   order:"MOST_MENTORS",search:"Atlas",page:3,
  }));
  expect(href).toContain("/mentor/team-coverage?");
  for(const key of ["filter=NO_PRIMARY_MENTOR","status=ACTIVE","assignment=SUPPORTING",
   "order=MOST_MENTORS","search=Atlas","page=3"]){
   expect(href).toContain(key);
  }
  expect(href).not.toMatch(/(?:collegeId|actorId|organizationId|role)=/);
 });
});
