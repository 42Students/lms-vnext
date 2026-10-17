import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {facultyLiveMutationSchema,facultyLiveWindow} from "@/modules/courses/faculty-live-mutation-model";
const src=(file:string)=>readFileSync(new URL("../../"+file,import.meta.url),"utf8");
const meeting={action:"CREATE" as const,lessonId:"11111111-1111-4111-8111-111111111111",title:"Class review",
 meetingUrl:"https://meet.google.com/abc-defg-hij",startsAt:"2099-04-02T10:00:00+05:30",endsAt:"2099-04-02T11:00:00+05:30",confirm:true as const};

describe("chat-5 final sprint: faculty teaching permissions, wording and live validation",()=>{
 it("FAC-courses-R04 replaces internal offering terminology with understandable class labels and keeps technical risk rules out of user-facing signals",()=>{
  const page=src("src/components/courses/faculty-course-workspace.tsx");
  const signal=src("src/components/courses/faculty-course-home-signals.tsx");
  expect(page).toContain('"This class"');
  expect(page).toContain('"All classes"');
  expect(page).not.toContain('"Shared Offering"');
  expect(page).not.toContain('"Exact teaching assignment"');
  expect(signal).not.toContain("legacy risk rules");
  expect(signal).not.toContain("structurally admin-owned");
 });
 it("FAC-courses-R07 returns specific invalid meeting URL, title, duration and end-after-start issues rather than one generic response",()=>{
  expect(facultyLiveMutationSchema.safeParse(meeting).success).toBe(true);
  const invalid=facultyLiveMutationSchema.safeParse({...meeting,meetingUrl:"https://example.org/private"});
  expect(invalid.success).toBe(false);
  if(!invalid.success)expect(invalid.error.issues.some(issue=>issue.message.includes("HTTPS meeting link required"))).toBe(true);
  const backwards=facultyLiveMutationSchema.safeParse({...meeting,endsAt:"2099-04-02T09:00:00+05:30"});
  expect(backwards.success).toBe(false);
  if(!backwards.success)expect(backwards.error.issues.some(issue=>issue.message.includes("End must follow start"))).toBe(true);
  const long=facultyLiveMutationSchema.safeParse({...meeting,endsAt:"2099-04-03T10:00:00+05:30"});
  expect(long.success).toBe(false);
  if(!long.success)expect(long.error.issues.some(issue=>issue.message.includes("12 hours"))).toBe(true);
  const command=src("src/modules/courses/faculty-live-editor-command.ts");
  expect(command).toContain("issue?.message");
 });
 it("FAC-courses-R08 retains a future/safe meeting time but does not reject merely because it falls outside college academic period metadata",()=>{
  expect(facultyLiveWindow({startsAt:meeting.startsAt,endsAt:meeting.endsAt},
   {startDate:"2099-01-01",endDate:"2099-03-01"})).toBe(true);
  expect(facultyLiveWindow({startsAt:meeting.startsAt,endsAt:"2099-04-02T09:59:00+05:30"},
   {startDate:"2099-04-01",endDate:"2099-06-30"})).toBe(false);
  const source=src("src/modules/courses/faculty-live-mutation-model.ts");
  expect(source).toContain("legacy live scheduling is not restricted");
 });
});