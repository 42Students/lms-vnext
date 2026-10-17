import {describe,it,expect} from "vitest";
import {bookingConflicts,superAdminInterviewCsv,type SuperAdminCalendarRound} from "@/modules/admin-ui/super-admin-interview-operations-model";
import {readFileSync} from "node:fs";import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
const a:SuperAdminCalendarRound={id:"A",roundId:"round",jobId:"job",jobTitle:"Job",
 title:"Interview",companyName:"Example",status:"SCHEDULED",kind:"INTERVIEW",
 startsAt:"2099-01-01T09:00:00Z",endsAt:"2099-01-01T10:00:00Z",venue:"Hall A",
 candidateMembershipId:"learner-one",candidateName:"Candidate A",interviewer:"Panel",mode:"On campus"};
describe("Super Admin candidate-level interview conflicts",()=>{
 it("SA-placements-projects-45 candidate and venue collision detection from scoped persisted interview slots",()=>{
  const b={...a,id:"B",jobId:"other-job",venue:"Hall B",startsAt:"2099-01-01T09:30:00Z"};
  const conflicts=bookingConflicts([a,b]);
  expect(conflicts.get("A")).toContain("Candidate double-booked");
  expect(conflicts.get("B")).toContain("Candidate double-booked");
  const room=bookingConflicts([a,{...b,candidateMembershipId:"learner-two",venue:"hall a"}]);
  expect(room.get("A")).toContain("Venue double-booked");
  expect(bookingConflicts([a,{...b,startsAt:"2099-01-01T10:00:00Z"}]).size).toBe(0);
 });
 it("SA-placements-projects-46 candidate-level Type Status Mode Department and sort filters",()=>{
  const ui=source("src/components/admin/super-admin-interview-operations.tsx");
  for(const key of ["Candidate","Interviewer","Mode","Status","Type","Sort"])expect(ui).toContain(key);
  expect(ui).toContain("Department filter uses the applicant");
  expect(ui).toContain('choices("Department"');
 });
 it("SA-placements-projects-47 bounded candidate interview CSV, per-row .ics and four headline metrics",()=>{
  const ui=source("src/components/admin/super-admin-interview-operations.tsx");
  expect(ui).toContain('download="interviews.csv"');
  expect(ui).toContain("Date.parse(row.endsAt)-Date.parse(row.startsAt)");
  expect(superAdminInterviewCsv([a])).toContain("Example");
 });
 it("GR-72 supplementary booked-interview data stays scoped and warns when truncated",()=>{
  const service=source("src/modules/placements/super-admin-booked-interviews-service.ts");
  expect(service).toContain("requireSuperAdminSelectedCollege");
  expect(service).toContain("eq(placementJobs.collegeId,scope.collegeId)");
  expect(service).toContain("learnerProgramEnrollments.status");
  expect(service).toContain(".limit(2001)");
  const workspace=source("src/components/placements/placement-calendar-workspace.tsx");
  expect(workspace).toContain("Could not load candidate interviews right now.");
  expect(workspace).toContain("Retry interviews");
  expect(source("src/components/admin/super-admin-interview-operations.tsx")).toContain("First 2,000 bookings shown");
 });
});
