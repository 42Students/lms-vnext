import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {mentorMeetingDisplayStatus} from "@/modules/projects/mentor-calendar-view";
import {deriveMentorProjectAttention} from "@/modules/projects/mentor-attention";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("mentor meetings and attention",()=>{
 it("MEN-projects-meetings-67 matches meeting subtitle and join action",()=>{
  expect(source("src/app/(authenticated)/mentor/calendar/page.tsx")).toContain("Every scheduled meeting across your assigned projects, in one place.");
  expect(source("src/components/projects/mentor-meetings-calendar.tsx")).toContain(">Join link</a>");
 });
 it("MEN-projects-meetings-68 marks same-day ended scheduled meeting MISSED",()=>{
  const m={id:"m",projectId:"p",projectTitle:"P",projectStatus:"ACTIVE",title:"M",status:"SCHEDULED" as const,
   startsAt:"2099-02-02T10:00:00Z",endsAt:"2099-02-02T11:00:00Z",timeZone:"UTC",meetingUrl:null,linkedSprintTitle:null};
  expect(mentorMeetingDisplayStatus(m,new Date("2099-02-02T11:01:00Z"))).toBe("MISSED");
 });
 it("MEN-projects-meetings-69 presents friendly retry for meeting load failure",()=>{
  const code=source("src/app/(authenticated)/mentor/calendar/error.tsx");
  expect(code).toContain("We couldn’t load your meetings.");
  expect(code).toContain("onClick={reset}");
 });
 it("MEN-projects-meetings-70 restores legacy attention copy",()=>{
  expect(source("src/app/(authenticated)/mentor/notifications/page.tsx")).toContain("Announcements, submissions waiting for review, stalled projects, and meetings coming up soon.");
  expect(source("src/modules/projects/mentor-attention.ts")).toContain("submission waiting for your review");
 });
 it("MEN-projects-meetings-73 flags idle planned projects, not blocked or completed",()=>{
  const past=new Date("2099-01-01T00:00:00Z"),now=new Date("2099-01-10T00:00:00Z");
  const input=(s:string)=>[{projectId:"p",projectTitle:"P",projectStatus:s,
   projectUpdatedAt:past,lastActivityAt:null,submission:null,meetings:[]}];
  for(const s of ["PLANNED","ACTIVE"])
    expect(deriveMentorProjectAttention(input(s),now).some(x=>x.kind==="STALLED")).toBe(true);
  for(const s of ["BLOCKED","COMPLETED","ARCHIVED"])
    expect(deriveMentorProjectAttention(input(s),now).some(x=>x.kind==="STALLED")).toBe(false);
 });
});
