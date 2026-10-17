import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("College Admin TPO drive overview access",()=>{
 it("TPO-drive-workspace-11 checks central college-scoped placement permissions instead of the TPO role only",()=>{
  const page=readFileSync("src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx","utf8");
  const policy=readFileSync("src/modules/permissions/policy.ts","utf8");
  expect(page).toContain('can(context, "placements.manage", { collegeId: context.membership.collegeId })');
  expect(page).toContain("await getPlacementJob(context, jobId)");
  expect(page).toContain("AuthorizationError");
  expect(page).toContain("notFound()");
  expect(page).not.toContain('hasMembershipRole(context, "TPO")');
  expect(policy).toContain('case "placements.manage":');
  expect(policy).toContain('hasMembershipRole(context, "COLLEGE_ADMIN")');
 });
});
