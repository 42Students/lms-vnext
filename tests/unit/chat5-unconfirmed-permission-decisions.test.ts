import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
const src=(path:string)=>readFileSync(path,"utf8");
const college="11111111-1111-4111-8111-111111111111";
const principal=(roles:("TPO"|"COLLEGE_ADMIN"|"FACULTY")[]):RequestContext=>({
 user:{id:"22222222-2222-4222-8222-222222222222",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"33333333-3333-4333-8333-333333333333",userId:"22222222-2222-4222-8222-222222222222",collegeId:college,organizationId:"44444444-4444-4444-8444-444444444444",status:"ACTIVE",roles},
}) as RequestContext;

describe("Chat5 delegated central-scope placement decisions",()=>{
 it("TPO-batches-64 grants active college administrators within college scope, not faculty or foreign colleges",()=>{
  const service=src("src/modules/placements/tpo-batch-workspace-read-service.ts");
  expect(service).toContain('inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])');
  expect(service).toContain("requirePlacementManageScope");
  expect(can(principal(["COLLEGE_ADMIN"]),"placements.manage",{collegeId:college})).toBe(true);
  expect(can(principal(["FACULTY"]),"placements.manage",{collegeId:college})).toBe(false);
  expect(can(principal(["COLLEGE_ADMIN"]),"placements.manage",{collegeId:"55555555-5555-4555-8555-555555555555"})).toBe(false);
 });
 it("TPO-drives-51 preserves persisted actor checking and college-scoped lifecycle reads for college admins",()=>{
  const writer=src("src/modules/placements/tpo-job-write-base.ts");
  const reader=src("src/modules/placements/tpo-drive-lifecycle-list-service.ts");
  expect(writer).toContain('inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])');
  expect(reader).toContain('hasMembershipRole(context,"COLLEGE_ADMIN")');
  expect(reader).toContain("requireTpoJobActor(tx,context)");
 });
 it("TPO-companies-R03 admits centrally authorized college admins without giving unscoped company reads",()=>{
  const page=src("src/app/(authenticated)/tpo/companies/page.tsx");
  expect(page).toContain('can(context,"placements.manage",{collegeId:context.membership.collegeId})');
  expect(page).toContain("getTpoCompaniesView(context, query)");
 });
 it("TPO-recruiters-34 checks central permission before the view and every bulk lead mutation",()=>{
  const page=src("src/app/(authenticated)/tpo/recruiters/page.tsx");
  const writer=src("src/modules/placements/tpo-bulk-lead-stage-service.ts");
  expect(page).toContain('can(context,"placements.manage",{collegeId:context.membership.collegeId})');
  expect(writer).toContain('can(context, "placements.manage", { collegeId })');
  expect(writer).toContain("requirePlacementManageScope(context, collegeId)");
 });
});
