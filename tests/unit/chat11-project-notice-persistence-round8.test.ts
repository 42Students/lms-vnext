import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Mentor persistent project notice contract",()=>{
 it("MEN-projects-meetings-72 records scoped persistent project event notifications atomically",()=>{
  const helper=read("src/modules/projects/project-notification-service.ts");
  expect(helper).toContain("deliverInAppNotificationInTransaction");
  for(const condition of ['eq(collegeMemberships.status, "ACTIVE")',
      'eq(users.platformStatus, "ACTIVE")','isNull(projectMembers.endedAt)',
      "notice.collegeId","new Set(rows.map(row => row.userId))"]){
    expect(helper).toContain(condition);
  }
  for(const file of ["member-service.ts","meeting-service.ts",
    "task-comment-service.ts","task-assignment-service.ts",
    "resource-service.ts","mentor-final-delivery-decision-service.ts"]){
    expect(read("src/modules/projects/"+file)).toMatch(/notify(?:ActiveProjectMembers|ProjectMemberships)/);
  }
  const integration=read("tests/integration/project-notification-r01.test.ts");
  for(const phrase of ["New project assigned","Added to project","New task assigned",
      "Meeting requested","Removed from project","Project archived",
      "having count(*)>1"]){expect(integration).toContain(phrase);}
 });
});
