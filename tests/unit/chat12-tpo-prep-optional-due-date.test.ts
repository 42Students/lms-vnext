import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoPrepAssignmentInputSchema} from "@/modules/placements/tpo-prep-assignment-service";
const UUID="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const MEMBER="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const valid={offeringId:UUID,membershipIds:[MEMBER]};
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

describe("TPO-students-10 optional due-date, assignment and notification contracts",()=>{
 it("accepts omission and explicit null but preserves valid timezone-aware deadline",()=>{
  expect(tpoPrepAssignmentInputSchema.safeParse(valid).success).toBe(true);
  expect(tpoPrepAssignmentInputSchema.safeParse({...valid,dueAt:null}).success).toBe(true);
  expect(tpoPrepAssignmentInputSchema.safeParse({
   ...valid,dueAt:"2099-06-15T09:30:00+05:30",
  }).success).toBe(true);
 });
 it("refuses ambiguous local times, badly formed instants and duplicate selected learners",()=>{
  expect(tpoPrepAssignmentInputSchema.safeParse({...valid,dueAt:"2099-06-15T09:30"}).success).toBe(false);
  expect(tpoPrepAssignmentInputSchema.safeParse({...valid,dueAt:"yesterday"}).success).toBe(false);
  expect(tpoPrepAssignmentInputSchema.safeParse({...valid,membershipIds:[MEMBER,MEMBER]}).success).toBe(false);
  expect(tpoPrepAssignmentInputSchema.safeParse({...valid,membershipIds:[]}).success).toBe(false);
 });
 it("migration alters the registered table without editing the immutable 0134 definition",()=>{
  const migration=src("drizzle/0136_tpo_prep_optional_due_date.sql");
  const first=src("drizzle/0134_lanes_round_2.sql");
  expect(first).toContain("due_at timestamptz not null");
  expect(migration).toContain("ALTER COLUMN due_at DROP NOT NULL");
  expect(migration).toContain("due_at IS NULL OR due_at > created_at");
  expect(src("src/db/schema/placement-tpo-prep-assignments.ts")).toContain(
   'dueAt:timestamp("due_at",{withTimezone:true}),');
 });
 it("TPO course picker preserves selection, optional date and learner notices",()=>{
  const ui=src("src/components/tpo/tpo-students-assign-prep.tsx");
  const writer=src("src/modules/placements/tpo-prep-assignment-service.ts");
  expect(ui).toContain("Due date and time (IST, optional)");
  expect(ui).toContain("No due date");
  expect(ui).toContain("dueAt:deadline");
  expect(writer).toContain("input.dueAt?new Date(input.dueAt):null");
  expect(writer).toContain("await requireTpoJobActor(tx,ctx)");
  expect(writer).toContain("onConflictDoNothing()");
  expect(writer).toContain("body:\"Your placement cell assigned \"");
 });
});
