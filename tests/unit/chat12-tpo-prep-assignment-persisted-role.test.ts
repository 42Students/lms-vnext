import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mock=vi.hoisted(()=>({persisted:vi.fn(),scope:vi.fn(),table:vi.fn(),db:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mock.db}));
vi.mock("@/modules/placements/tpo-persisted-actor-service",()=>({
 requirePersistedTpoMembership:mock.persisted,
}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:mock.scope}));
vi.mock("@/modules/placements/staged-tables",()=>({placementTableExists:mock.table}));
import {assignTpoPrepCourse,listTpoPrepCourseOptions}
 from "@/modules/placements/tpo-prep-assignment-service";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OFFERING="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const LEARNER="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ctx:RequestContext={
 user:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",identityUid:"tpo-prep",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  collegeId:COLLEGE,organizationId:"ffffffff-ffff-4fff-8fff-ffffffffffff",
  status:"ACTIVE",roles:["TPO"]},
};
const assignment={offeringId:OFFERING,dueAt:"2099-12-01T12:00:00.000+05:30",
 membershipIds:[LEARNER]};
describe("TPO-students-10 preparation assignment current TPO permission boundary",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.persisted.mockResolvedValue(ctx.membership!.id);
  mock.scope.mockResolvedValue({id:COLLEGE,organizationId:ctx.membership!.organizationId});
  mock.table.mockResolvedValue(true);
 });
 it("a revoked persisted TPO cannot read college course options or assign learners",async()=>{
  mock.persisted.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(listTpoPrepCourseOptions(ctx)).rejects.toBeInstanceOf(AuthorizationError);
  await expect(assignTpoPrepCourse(ctx,assignment)).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.table).not.toHaveBeenCalled();
  expect(mock.db).not.toHaveBeenCalled();
 });
 it("a disabled or wrong-role principal fails before a persisted role or database read",async()=>{
  const learner:RequestContext={...ctx,membership:{...ctx.membership!,roles:["LEARNER"]}};
  const disabled:RequestContext={...ctx,user:{...ctx.user,platformStatus:"DISABLED"}};
  for(const principal of [learner,disabled]){
   await expect(assignTpoPrepCourse(principal,assignment)).rejects.toBeInstanceOf(AuthorizationError);
  }
  expect(mock.persisted).not.toHaveBeenCalled();
  expect(mock.db).not.toHaveBeenCalled();
 });
 it("preserves a second persisted actor lock inside the write transaction, before creating any notice",()=>{
  const src=readFileSync(new URL("../../src/modules/placements/tpo-prep-assignment-service.ts",import.meta.url),"utf8");
  expect(src).toContain("await requirePersistedTpoMembership(ctx,m.collegeId)");
  const tx=src.indexOf("return getDb().transaction(async tx=>");
  const guard=src.indexOf("await requireTpoJobActor(tx,ctx)",tx);
  const lock=src.indexOf('for("update").limit(1)',guard);
  const notification=src.indexOf("await tx.insert(inAppNotifications)",guard);
  expect(guard).toBeGreaterThan(tx);
  expect(lock).toBeGreaterThan(guard);
  expect(notification).toBeGreaterThan(lock);
  expect(src).toContain('eq(departments.collegeId,college.id)');
  expect(src.match(/isNull\(departments\.archivedAt\)/g)).toHaveLength(2);
  expect(src).toContain('onConflictDoNothing()');
 });
 it("TPO-students-10 optional deadline requires registered nullable storage and preserves the no-deadline state",()=>{
  const src=readFileSync(new URL("../../src/modules/placements/tpo-prep-assignment-service.ts",import.meta.url),"utf8");
  const ui=readFileSync(new URL("../../src/components/tpo/tpo-students-assign-prep.tsx",import.meta.url),"utf8");
  const proposal=readFileSync(new URL("../../docs/proposed-migrations/tpo-students-10-prep-optional-due.sql",import.meta.url),"utf8");
  expect(src).toContain('dueAt:z.iso.datetime({offset:true}).nullable().optional()');
  expect(src).toContain('const due=input.dueAt?new Date(input.dueAt):null');
  expect(src).toContain('if(due===null)');
  expect(src).toContain("is_nullable='YES'");
  expect(src).toContain('if(!nullable)throw new TpoPrepError("UNAVAILABLE")');
  expect(src).toContain('dueAt:due,assignedByUserId:ctx.user.id');
  expect(ui).toContain('const deadline=dueAt?tpoPrepDueAtUtc(dueAt):null');
  expect(ui).toContain('dueAt?dueAt+" IST":"No due date"');
  expect(proposal).toContain("ALTER COLUMN due_at DROP NOT NULL");
  expect(proposal).toContain("due_at IS NULL OR due_at > created_at");
 });
});
