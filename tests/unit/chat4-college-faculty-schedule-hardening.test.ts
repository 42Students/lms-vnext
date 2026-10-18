import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {scheduleReassignInput} from "@/modules/people/college-faculty-schedule-reassignment-service";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";

const uuid="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const code=()=>readFileSync("src/modules/people/college-faculty-schedule-reassignment-service.ts","utf8");
const actor:RequestContext={
 user:{id:"actor",identityUid:"actor",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership",collegeId:uuid,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};

describe("College faculty schedule reassignment break-it workflows",()=>{
 it("COL-faculty-reassign-01 requires explicit confirmation and a valid replacement member",()=>{
  expect(scheduleReassignInput.safeParse({replacementMembershipId:other,confirmed:true}).success).toBe(true);
  for(const bad of [
   {replacementMembershipId:other,confirmed:false},
   {replacementMembershipId:"not-a-uuid",confirmed:true},
   {replacementMembershipId:other},
   {replacementMembershipId:other,confirmed:true,injectedCollegeId:other},
  ]) expect(scheduleReassignInput.safeParse(bad).success).toBe(false);
  expect(can(actor,"academics.manage",{collegeId:uuid,organizationId:org})).toBe(true);
  expect(can(actor,"academics.manage",{collegeId:other,organizationId:org})).toBe(false);
  expect(can({...actor,user:{...actor.user,platformStatus:"DISABLED"}},
   "academics.manage",{collegeId:uuid,organizationId:org})).toBe(false);
 });

 it("COL-faculty-reassign-02 source faculty and scheduled sessions must be scoped to persisted college",()=>{
  const s=code();
  expect(s).toContain('if(!sourceFaculty)throw Error("Faculty not found in this college.")');
  const preview=s.slice(s.indexOf("export async function getFacultyScheduleReassignOptions("),
   s.indexOf("export async function reassignFacultyUpcomingSchedules("));
  expect(preview).toContain("db.transaction(async tx=>");
  expect(preview).toContain('assertPersistedPlatformPermission(tx,ctx,"academics.manage"');
  expect(preview.indexOf("assertPersistedPlatformPermission")).toBeLessThan(preview.indexOf("await tx.select"));
  expect(preview).not.toContain("await db.select");
  expect(s).toContain("eq(collegeMemberships.id,id)");
  expect(s).toContain("eq(collegeMemberships.collegeId,m.collegeId)");
  expect(s).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(s).toContain('p.userStatus==="ACTIVE"');
  expect(s).toContain("eq(departments.collegeId,m.collegeId)");
  expect(s).toContain("eq(sections.id,sectionScheduleEvents.sectionId)");
  expect(s).toContain("eq(sectionScheduleEvents.facultyMembershipId,old)");
  expect(s).toContain('gt(sectionScheduleEvents.startsAt,now)');
  expect(s).toContain("More than 200 upcoming sessions.");
  expect(s).toContain("Replacement faculty has an overlapping session");
 });

 it("COL-faculty-reassign-03 locks persisted actor and faculty before writes, retries without changes never double-audit",()=>{
  const s=code();
  const write=s.indexOf("export async function reassignFacultyUpcomingSchedules(");
  const trans=s.indexOf("return db.transaction(async tx=>",write);
  const principals=s.indexOf('   .for("share");',trans);
  const guard=s.indexOf('assertPersistedPlatformPermission(tx,ctx,"academics.manage"',trans);
  const serialization=s.indexOf("pg_advisory_xact_lock(hashtext(");
  const lock=s.indexOf('for("update",{of:sectionScheduleEvents})');
  const update=s.indexOf("tx.update(sectionScheduleEvents)");
  const noOp=s.indexOf('if(!results.some(row=>row.status==="REASSIGNED"))');
  const audit=s.indexOf("tx.insert(activityEvents)");
  expect(trans).toBeGreaterThan(-1);
  expect(principals).toBeGreaterThan(trans);
  expect(s).toContain("Lock the joined USERS and MEMBERSHIP_ROLES rows too.");
  expect(guard).toBeGreaterThan(principals);
  expect(serialization).toBeGreaterThan(guard);
  expect(lock).toBeGreaterThan(serialization);
  expect(update).toBeGreaterThan(lock);
  expect(noOp).toBeGreaterThan(update);
  expect(audit).toBeGreaterThan(noOp);
 });
});
