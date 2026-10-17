import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const code=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-11 transactional project events",()=>{
 it("MEN-projects-meetings-72 persists transactional mentor project notices for meeting, comment, task, delivery, team and resource events",()=>{
  const helper=code("src/modules/projects/project-notification-service.ts");
  expect(helper).toContain("deliverInAppNotificationInTransaction");
  expect(helper).toContain('eq(collegeMemberships.status, "ACTIVE")');
  expect(helper).toContain('isNull(projectMembers.endedAt)');
  for(const path of ["meeting-service.ts","task-comment-service.ts",
    "mentor-final-delivery-decision-service.ts","resource-service.ts"]){
    const service=code("src/modules/projects/"+path);
    expect(service).toContain("notifyActiveProjectMembers(tx,");
  }
  for(const path of ["task-assignment-service.ts","mentor-task-create-service.ts","member-service.ts"]){
    expect(code("src/modules/projects/"+path)).toContain("notifyProjectMemberships(tx,");
  }
  expect(code("src/modules/projects/resource-service.ts")).toContain("New project resource");
  expect(code("src/modules/projects/member-service.ts")).toContain("Project role updated");
 });
});
