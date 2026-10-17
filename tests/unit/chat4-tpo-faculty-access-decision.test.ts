import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("TPO-home-27 delegated access decision",()=>{
 it("TPO-home-27 requires explicit permission and a TPO membership rather than inferring access from any Faculty assignment",()=>{
  const access=source("src/modules/placements/tpo-workspace-access-model.ts");
  const policy=source("src/modules/permissions/policy.ts");
  expect(access).toContain('can(context, "placements.manage"');
  expect(access).toContain('hasMembershipRole(context, "TPO")');
  expect(policy).toContain('case "placements.manage":');
  expect(policy).toContain('hasMembershipRole(context, "TPO")');
  expect(policy).toContain("isSameMembershipCollege(context, resource)");
  expect(access).not.toContain('hasMembershipRole(context, "FACULTY")');
 });
});
