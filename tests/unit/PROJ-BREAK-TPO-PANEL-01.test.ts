import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {tpoStudentNotesInput} from "@/modules/placements/tpo-student-notes-service";

const COLLEGE="22222222-2222-4222-8222-222222222222";
const LEARNER="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SECOND="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const src=(name:string)=>readFileSync(resolve(process.cwd(),
 "src/modules/placements/"+name),"utf8");

describe("PROJ-BREAK-TPO-PANEL-01 private quick panel and note boundaries",()=>{
 it("rejects inactive/disabled learner links and limits event history to placement actions",()=>{
  const source=src("tpo-student-panel-detail-service.ts");
  expect(source).toContain('hasMembershipRole(ctx,"TPO")');
  expect(source).toContain('membership.status!=="ACTIVE"');
  expect(source).toContain("requirePlacementManageScope(ctx,membership.collegeId)");
  expect(source).toContain('eq(collegeMemberships.collegeId,college.id)');
  expect(source).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(source).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(source).toContain('eq(activityEvents.module,"PLACEMENTS")');
  expect(source).not.toContain('inArray(activityEvents.module,["PLACEMENTS","IDENTITY","ACADEMICS"])');
  expect(source).toContain("if(!student)return null;");
  expect(source).toContain("eq(placementJobs.collegeId,college.id)");
 });
 it("accepts only normalized, bounded, unique membership IDs and a nonempty TPO note",()=>{
  const valid={membershipIds:[LEARNER,SECOND],note:"  Discussion completed  "};
  expect(tpoStudentNotesInput.parse(valid).note).toBe("Discussion completed");
  for(const bad of [
   {...valid,membershipIds:[]},
   {...valid,membershipIds:[LEARNER,LEARNER]},
   {...valid,membershipIds:["other-college"]},
   {...valid,membershipIds:Array(101).fill(LEARNER)},
   {...valid,note:"   "},
   {...valid,note:"x".repeat(2001)},
   {...valid,collegeId:COLLEGE},
  ])expect(tpoStudentNotesInput.safeParse(bad).success).toBe(false);
 });
 it("authorizes notes through persisted actor and tenant, and audits each changed row",()=>{
  const source=src("tpo-student-notes-service.ts");
  expect(source).toContain("const collegeId=await requireTpoBatchActor(ctx)");
  expect(source).toContain('assertPersistedPlatformPermission(tx,ctx,"placements.manage"');
  expect(source).toContain("eq(collegeMemberships.collegeId,collegeId)");
  expect(source).toContain("await tx.insert(activityEvents).values");
  expect(source).toContain("skipped:input.membershipIds.length-saved.length");
 });
});
