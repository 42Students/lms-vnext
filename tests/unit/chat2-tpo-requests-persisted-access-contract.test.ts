import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("TPO request inbox non-leaking persisted authorization",()=>{
 it("revalidates the active TPO actor before querying request rows",()=>{
  const source=readFileSync(join(process.cwd(),"src/modules/placements/tpo-global-requests-service.ts"),"utf8");
  const guard=source.indexOf("await requirePersistedTpoMembership(context,member.collegeId)");
  const query=source.indexOf("listTpoStudentRequests(context, {");
  expect(guard).toBeGreaterThan(0);
  expect(query).toBeGreaterThan(guard);
  expect(source).toContain('throw new AuthorizationError("placements.manage")');
 });
});
