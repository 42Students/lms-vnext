import { describe, expect, it } from "vitest";
import {readFileSync} from "node:fs";
import {mentorMeetingCeremonyLabel,mentorMeetingHttpUrl,mentorMeetingScheduleError} from "@/modules/projects/mentor-meeting-form-model";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const workspace=()=>read("src/components/projects/project-workspace.tsx");
describe("chat-7 mentor authored briefing, reviewer access and scheduling",()=>{
 it("MEN-projects-meetings-17 preserves authored deliverables without invented placeholders",()=>{
  const s=workspace();
  expect(s).toContain("authoredBrief");expect(s).toContain("About this project");expect(s).toContain("Deliverables");
 });
 it("MEN-projects-meetings-22 links the mentor directly to final submission review",()=>{
  const s=workspace();expect(s).toContain("Review submission");expect(s).toContain("?tab=delivery");
 });
 it("MEN-projects-meetings-25 identifies active members and handles mentor profile links",()=>{
  const s=workspace();expect(s).toContain("StatusBadge tone={active");expect(s).toContain("LinkedIn profile");
 });
 it("MEN-projects-meetings-28 renders exact legacy ceremony names",()=>{
  expect(mentorMeetingCeremonyLabel("PLANNING")).toBe("Sprint planning");
  expect(mentorMeetingCeremonyLabel("STANDUP")).toBe("Stand-up");
  expect(mentorMeetingCeremonyLabel("REVIEW")).toBe("Sprint review");
  expect(mentorMeetingCeremonyLabel("RETRO")).toBe("Retrospective");
 });
 it("MEN-projects-meetings-29 validates meeting web links and future IST windows",()=>{
  expect(mentorMeetingHttpUrl("http://example.edu/meet")).toBe(true);
  expect(mentorMeetingHttpUrl("https://example.edu/meet")).toBe(true);
  expect(mentorMeetingHttpUrl("javascript:alert(1)")).toBe(false);
  expect(mentorMeetingHttpUrl("https://user:pass@example.edu")).toBe(false);
  const base={title:"Review",startsAt:"2099-02-01T10:00",endsAt:"2099-02-01T11:00",meetingUrl:"https://example.edu/meet",nowMs:Date.parse("2099-01-01T00:00:00Z")};
  expect(mentorMeetingScheduleError(base)).toBe(null);
  expect(mentorMeetingScheduleError({...base,startsAt:"2098-12-01T10:00"})).toBe("Meeting date must be in the future.");
  expect(mentorMeetingScheduleError({...base,meetingUrl:""})).toBe("Meeting link or physical venue is required.");
  expect(mentorMeetingScheduleError({...base,meetingUrl:"",draft:true})).toBe(null);
 });
});
