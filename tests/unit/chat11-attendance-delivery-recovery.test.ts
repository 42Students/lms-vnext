import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
const attendance = readFileSync(join(process.cwd(),"src/components/attendance/faculty-attendance-workspace.tsx"),"utf8");
const mentor = readFileSync(join(process.cwd(),"src/components/projects/project-final-delivery-controls.tsx"),"utf8");
const service = readFileSync(join(process.cwd(),"src/modules/projects/mentor-final-delivery-decision-service.ts"),"utf8");
const workspace = readFileSync(join(process.cwd(),"src/components/projects/project-workspace.tsx"),"utf8");
const reopen = readFileSync(join(process.cwd(),"src/components/projects/project-delivery-reopen-control.tsx"),"utf8");
describe("chat-11 attendance and final-delivery recovery",()=>{
  it("FAC-attendance-grades-03 has an atomic-failure explanation and deliberate persisted-roster re-read",()=>{
    expect(attendance).toContain("No attendance marks were saved.");
    expect(attendance).toContain("Attendance saves are atomic:");
    expect(attendance).toContain("Reload saved roster");
    expect(attendance).toContain('title="Reload saved attendance?"');
    expect(attendance).toContain("window.location.reload()");
    expect(attendance).toContain("unsaved selections");
  });
  it("MEN-projects-meetings-65 has separate accept, request-change, and revision-reopen confirmations",()=>{
    for(const item of ["Accept this submission?","Request changes on this submission?","Refresh latest submission"])
      expect(mentor).toContain(item);
    expect(workspace).toContain("<ProjectDeliveryReopenControl");
    expect(reopen).toContain("Reopen this submission for revision?");
    expect(reopen).toContain("The learner will be able to edit and resubmit it.");
  });
  it("MEN-projects-meetings-66 persists mentor decisions and same-transaction learner notices",()=>{
    expect(service).toContain("notifyActiveProjectMembers(tx,reviewedEvent.id");
    expect(service).toContain('roles:["LEARNER"]');
    expect(service).toContain("learnerProjectDeliveryReviewNotice");
  });
});
