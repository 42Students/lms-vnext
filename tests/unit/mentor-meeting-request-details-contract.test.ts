import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const source=(path:string)=>readFileSync(resolve(process.cwd(),path),"utf8");
describe("Recorded Mentor meeting request detail contract",()=>{
 const svc=source("src/modules/projects/mentor-calendar-service.ts");
 const pane=source("src/components/projects/mentor-meetings-calendar.tsx");
 const controls=source("src/components/projects/mentor-meeting-request-actions.tsx");
 it("resolves requester by college-bounded membership IDs, not client names",()=>{
  expect(svc).toContain("requestedByMembershipId:projectMeetings.requestedByMembershipId");
  expect(svc).toContain("eq(collegeMemberships.collegeId,membership.collegeId)");
  expect(svc).toContain("requestedByName:row.requestedByMembershipId");
 });
 it("joins task only when both task and meeting belong to the same project",()=>{
  expect(svc).toContain("eq(projectTasks.id,projectMeetings.linkedTaskId)");
  expect(svc).toContain("eq(projectTasks.projectId,projectInstances.id)");
  expect(pane).toContain("encodeURIComponent(meeting.linkedTaskId)");
 });
 it("displays asked-by and requested time without inventing calendar acceptance",()=>{
  expect(pane).toContain("Requested by:");
  expect(pane).toContain("Suggested slot:");
  expect(pane).toContain("This historical field is not proof of a current Google connection");
  expect(pane).toContain("No verified live calendar sync");
 });
 it("offers three explicit decisions and online or in-person confirmation",()=>{
  expect(controls).toContain("Yes, this time");
  expect(controls).toContain("Another time");
  expect(controls).toContain("No, answer in a note");
  expect(controls).toContain('expectedUpdatedAt:meeting.updatedAt');
  expect(controls).toContain("Provide a join link or physical meeting venue.");
  expect(controls).toContain("location:venue.trim()");
  expect(controls).toContain('action:"CANCEL",confirmed:true');
 });
});
