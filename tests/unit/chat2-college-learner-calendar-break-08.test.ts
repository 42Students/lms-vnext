import {describe,expect,it} from "vitest";
import {DRIVE_INTERVIEW_PAGE_SIZE,driveInterviewsQuerySchema,driveInterviewsParams,
 driveInterviewsHref,driveRoundTime} from "@/modules/placements/college-drive-interviews-model";
import {collegeInterviewActionSchema} from "@/modules/placements/college-interview-action-model";
import {collegeInterviewIcs} from "@/modules/placements/college-interview-calendar-model";
import {superAdminBookedInterviewWindow} from "@/modules/placements/super-admin-booked-interviews-range";
import {learnerInterviewCalendarInputSchema,foldLearnerCalendarLine,
 learnerInterviewCalendarArtifacts} from "@/modules/placements/learner-interview-calendar-model";

const a="00000000-0000-4000-8000-000000000001",b="00000000-0000-4000-8000-000000000002";
const begin="2026-10-20T04:00:00.000Z";

describe("TPO-BREAK-calendar-08 query access, ICS injection, scheduled dates and private learner data",()=>{
 it("college interview filter rejects array ambiguity, invalid UUIDs and page overflow",()=>{
  expect(DRIVE_INTERVIEW_PAGE_SIZE).toBe(25);
  expect(driveInterviewsParams({})).toEqual({kind:"ALL",status:"ALL",page:1});
  expect(driveInterviewsParams({kind:"INTERVIEW",status:"SCHEDULED",page:"3",applicationId:a}))
   .toEqual({kind:"INTERVIEW",status:"SCHEDULED",page:3,applicationId:a});
  expect(driveInterviewsParams({status:["ALL","CANCELLED"]})).toBeNull();
  expect(driveInterviewsParams({page:"0"})).toBeNull();
  expect(driveInterviewsParams({applicationId:"other-tenant"})).toBeNull();
  expect(driveInterviewsQuerySchema.safeParse({collegeId:a}).success).toBe(false);
  const href=driveInterviewsHref("job/123",driveInterviewsQuerySchema.parse({kind:"INTERVIEW",page:2}));
  expect(href).toContain("job%2F123/interviews");
  expect(href).toContain("page=2");
  expect(href).toContain("kind=INTERVIEW");
  expect(driveRoundTime(null,null)).toBe("Not scheduled");
  expect(driveRoundTime(new Date(begin),"Asia/Kolkata")).toContain("Asia/Kolkata");
 });
 it("college appointment actions need a secure location, deliberate confirmation and CAS",()=>{
  const appointment={roundId:a,applicationId:b,scheduledAt:begin,durationMinutes:30,
   mode:"ON_CAMPUS",venue:"Main hall",meetingUrl:null,interviewer:"Faculty"};
  expect(collegeInterviewActionSchema.safeParse({action:"SCHEDULE",confirmed:true,appointment}).success).toBe(true);
  expect(collegeInterviewActionSchema.safeParse({action:"SCHEDULE",confirmed:false,appointment}).success).toBe(false);
  expect(collegeInterviewActionSchema.safeParse({action:"SCHEDULE",confirmed:true,appointment:{...appointment,venue:""}}).success).toBe(false);
  expect(collegeInterviewActionSchema.safeParse({action:"SCHEDULE",confirmed:true,appointment:{...appointment,mode:"VIRTUAL",venue:null,meetingUrl:"http://insecure.test"}}).success).toBe(false);
  expect(collegeInterviewActionSchema.safeParse({action:"SCHEDULE",confirmed:true,appointment:{...appointment,mode:"VIRTUAL",venue:null,meetingUrl:"https://meet.example.test/"}}).success).toBe(true);
  expect(collegeInterviewActionSchema.safeParse({action:"EDIT",confirmed:true,appointment,interviewId:a,expectedVersion:0,reason:"Change"}).success).toBe(false);
  expect(collegeInterviewActionSchema.safeParse({action:"EDIT",confirmed:true,appointment,interviewId:a,expectedVersion:1,reason:"Move to new hall"}).success).toBe(true);
  expect(collegeInterviewActionSchema.safeParse({action:"CANCEL",confirmed:true,interviewId:a,expectedVersion:1,reason:"x"}).success).toBe(false);
  expect(collegeInterviewActionSchema.safeParse({action:"CANCEL",confirmed:true,interviewId:a,expectedVersion:1,reason:"Student requested"}).success).toBe(true);
  expect(collegeInterviewActionSchema.safeParse({action:"SCHEDULE",confirmed:true,appointment,collegeId:"forged"}).success).toBe(false);
 });
 it("calendar export rejects corrupt dates/duration before constructing an invalid event",()=>{
  const base={id:a,title:"Interview",date:begin,durationMinutes:30,location:"Main hall"};
  expect(()=>collegeInterviewIcs({...base,date:"not-a-date"})).toThrow("Invalid interview calendar details");
  for(const duration of [0,-1,1.5,Number.NaN,Number.POSITIVE_INFINITY,1441])
   expect(()=>collegeInterviewIcs({...base,durationMinutes:duration})).toThrow("Invalid interview calendar details");
  const ics=collegeInterviewIcs({...base,title:"Interview\r\nATTENDEE:attacker",
    location:"Hall A; floor, 2\r\nORGANIZER:attacker"});
  expect(ics).toContain("BEGIN:VEVENT");
  expect(ics).toContain("DTSTART:20261020T040000Z");
  expect(ics).toContain("DTEND:20261020T043000Z");
  expect(ics).toContain("SUMMARY:Interview\\nATTENDEE:attacker");
  expect(ics).not.toContain("\r\nATTENDEE:attacker");
  expect(ics).not.toContain("\r\nORGANIZER:attacker");
  expect(ics).toContain("END:VCALENDAR");
 });
 it("Super Admin date bounds use IST midnight, exclude next-day records and reject normalized invalid dates",()=>{
  const same=superAdminBookedInterviewWindow("2026-10-20","2026-10-20");
  expect(same?.fromDate.toISOString()).toBe("2026-10-19T18:30:00.000Z");
  expect(same?.toDate.toISOString()).toBe("2026-10-20T18:30:00.000Z");
  expect(superAdminBookedInterviewWindow("2026-02-31","2026-03-03")).toBeNull();
  expect(superAdminBookedInterviewWindow("2026-10-21","2026-10-20")).toBeNull();
  expect(superAdminBookedInterviewWindow("2026-10-20","unbounded")).toBeNull();
 });
 it("learner calendar preserves Unicode codepoints under RFC5545 folding and blocks private data",()=>{
  const input={applicationId:a,roundId:b,companyName:"Placement employer",
   roleTitle:"Developer",roundName:"Interview",scheduledAt:begin,durationMinutes:30,
   venue:"Hall A",mode:"ON_CAMPUS"} as const;
  expect(learnerInterviewCalendarInputSchema.safeParse(input).success).toBe(true);
  expect(learnerInterviewCalendarInputSchema.safeParse({...input,studentEmail:"private@example.test"}).success).toBe(false);
  expect(learnerInterviewCalendarArtifacts({...input,scheduledAt:null},new Date(begin))).toBeNull();
  const artifact=learnerInterviewCalendarArtifacts(input,new Date(begin));
  expect(artifact?.filename).toBe("interview-"+b+".ics");
  expect(artifact?.ics).toContain("BEGIN:VEVENT");
  expect(artifact?.ics).toContain("DTSTART:20261020T040000Z");
  expect(artifact?.googleUrl).toContain("calendar.google.com/calendar/render?");
  expect(artifact?.ics).not.toContain("private@example.test");
  const line="SUMMARY:"+("🧑‍💻".repeat(35));
  const folded=foldLearnerCalendarLine(line);
  expect(folded.replaceAll("\r\n ","")).toBe(line);
  for(const chunk of folded.split("\r\n "))
   expect(new TextEncoder().encode(chunk).length).toBeLessThanOrEqual(75);
 });
});
