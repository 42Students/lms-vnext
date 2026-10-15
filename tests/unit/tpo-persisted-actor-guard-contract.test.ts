import {readFileSync} from "node:fs";
import {join} from "node:path";
import {expect,it} from "vitest";
it("requires stored active TPO role, membership, college and user before sensitive reads",()=>{
 const root=process.cwd();
 const guard=readFileSync(join(root,"src/modules/placements/tpo-persisted-actor-service.ts"),"utf8");
 expect(guard).toContain('eq(membershipRoles.role,"TPO")');
 expect(guard).toContain('eq(collegeMemberships.status,"ACTIVE")');
 expect(guard).toContain('eq(users.platformStatus,"ACTIVE")');
 expect(guard).toContain("eq(collegeMemberships.userId,context.user.id)");
 for(const path of [
  "src/modules/placements/company-share/manage-service.ts",
  "src/modules/placements/tpo-recruiter-access-service.ts",
 ]){
  const source=readFileSync(join(root,path),"utf8");
  expect(source).toContain("requirePersistedTpoMembership(context,college.id)".replace(
   "college.id",path.includes("recruiter-access")?"collegeId":"college.id"));
 }
});
