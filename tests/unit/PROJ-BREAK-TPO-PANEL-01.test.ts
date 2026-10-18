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
  expect(source).toContain("const collegeId=await requireTpoBatchActor(ctx)");
  expect(source).toContain("requirePlacementManageScope(ctx,collegeId)");
  expect(source.indexOf("requireTpoBatchActor(ctx)"))
   .toBeLessThan(source.indexOf("const db=getDb()"));
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

describe("PROJ-BREAK-TPO-PANEL-02 notes endpoint and double-submit recovery",()=>{
 it("fails closed on disabled learner accounts both for note writes and note reads",()=>{
  const code=src("tpo-student-notes-service.ts");
  const activeUsers=code.match(/eq\(users.platformStatus,"ACTIVE"\)/g)??[];
  const activeMembers=code.match(/eq\(collegeMemberships.status,"ACTIVE"\)/g)??[];
  expect(activeUsers).toHaveLength(2);
  expect(activeMembers).toHaveLength(2);
  expect(code).toContain('eq(collegeMemberships.collegeId,collegeId)');
 });
 it("rejects forged origin and oversized JSON stream before invoking private student-note mutations",()=>{
  const route=readFileSync(resolve(process.cwd(),
   "src/app/api/placements/tpo/students/notes/route.ts"),"utf8");
  expect(route).toContain("isSameOriginRequest(req)");
  expect(route).toContain("readTpoBulkRequestBody(req)");
  expect(route).not.toContain("await req.json()");
  expect(route.indexOf("readTpoBulkRequestBody(req)"))
   .toBeLessThan(route.indexOf("addTpoStudentNotes("));
  expect(route).toContain("if(error instanceof TpoBulkBodyError)");
 });
 it("uses a synchronous click and keyboard latch while preserving the note on failure",()=>{
  const code=readFileSync(resolve(process.cwd(),
   "src/components/tpo/tpo-student-note-editor.tsx"),"utf8");
  expect(code).toContain("if(!membershipIds.length||!note.trim()||busy||inFlight.current)return;");
  expect(code).toContain("inFlight.current=true;setBusy(true)");
  expect(code).toContain("finally{inFlight.current=false;setBusy(false);}");
  expect(code).toContain("void runGuarded(save)");
  expect(code).toContain("setNote(\"\")");
  expect(code).toContain("catch(error){setError(");
 });
});
