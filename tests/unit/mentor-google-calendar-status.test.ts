import {describe,expect,it,vi} from "vitest";
import {readMentorGoogleMeetingStatus} from
 "@/modules/projects/mentor-google-calendar-status";

const id="123e4567-e89b-12d3-a456-426614174000";
const calendarEventId="m"+id.replaceAll("-","");
const makeResponse=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
 status,headers:{"content-type":"application/json"},
});
const reader=(body:unknown,status=200)=>vi.fn(async()=>makeResponse(body,status)) as unknown as typeof fetch;
describe("Google Calendar provider-confirmed Mentor meeting status",()=>{
 it("counts only actual provider responses and checks stored recurrence/reminders",async()=>{
  const fetchImpl=reader({
   id:calendarEventId,status:"confirmed",updated:"2026-10-24T15:45:00Z",
   attendees:[
    {responseStatus:"accepted"},{responseStatus:"declined"},
    {responseStatus:"tentative"},{responseStatus:"needsAction"},
    {responseStatus:"accepted",organizer:true},
   ],
   reminders:{useDefault:false,overrides:[{method:"email",minutes:60}]},
   recurrence:["RRULE:FREQ=WEEKLY;COUNT=5"],
  });
  const result=await readMentorGoogleMeetingStatus("valid-token","primary",id,fetchImpl);
  expect(result).toEqual({
   syncState:"CONFIRMED",
   responseCounts:{accepted:1,declined:1,tentative:1,needsAction:1},
   responseCountReason:"COMPLETE",reminderOneHour:true,
   recurringWeekly:true,verifiedAt:"2026-10-24T15:45:00.000Z",
  });
  const [url,options]=(fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0] as
   [string,RequestInit];
  expect(url).toContain("/events/"+calendarEventId);
  expect(url).not.toContain("token");
  expect(options.redirect).toBe("error");
  expect(options.cache).toBe("no-store");
 });
 it("refuses to infer recipient acceptance from omitted or large guest lists",async()=>{
  const result=await readMentorGoogleMeetingStatus("token","primary",id,
   reader({id:calendarEventId,status:"confirmed",attendeesOmitted:true,
    attendees:[{responseStatus:"accepted"}]}));
  expect(result.responseCounts).toBeNull();
  expect(result.responseCountReason).toBe("ATTENDEES_OMITTED");
  expect(result.reminderOneHour).toBeNull();
 });
 it("distinguishes missing, cancelled and provider errors",async()=>{
  const missing=await readMentorGoogleMeetingStatus("token","primary",id,
   reader({error:{message:"not found"}},404));
  expect(missing.syncState).toBe("NOT_FOUND");
  const cancelled=await readMentorGoogleMeetingStatus("token","primary",id,
   reader({id:calendarEventId,status:"cancelled"}));
  expect(cancelled.syncState).toBe("CANCELLED");
  await expect(readMentorGoogleMeetingStatus("token","primary",id,
   reader({error:{message:"expired"}},401)))
   .rejects.toThrow("GOOGLE_CALENDAR_STATUS_UNAVAILABLE");
 });
 it("rejects mismatched events and invalid connection arguments",async()=>{
  await expect(readMentorGoogleMeetingStatus("token","primary",id,
   reader({id:"unrelated",status:"confirmed"})))
   .rejects.toThrow("GOOGLE_CALENDAR_STATUS_INVALID");
  await expect(readMentorGoogleMeetingStatus("","primary",id,reader({})))
   .rejects.toThrow("GOOGLE_CALENDAR_CONNECTION_UNAVAILABLE");
  await expect(readMentorGoogleMeetingStatus("token","primary","invalid",reader({})))
   .rejects.toThrow("GOOGLE_CALENDAR_MEETING_ID_INVALID");
 });
});
