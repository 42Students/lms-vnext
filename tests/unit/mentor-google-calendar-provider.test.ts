import {describe,expect,it,vi} from "vitest";
import {mentorGoogleConfig,mentorGoogleConsentUrl,
 mentorGoogleEventBody,mentorGoogleUpsertMeeting,mentorGoogleRemoveMeeting,
 mentorGoogleEventId,mentorGoogleRefreshToken,mentorGoogleVerifyCalendarAccess}
 from "@/modules/projects/mentor-google-calendar-provider";
const uuid="12345678-1234-4123-8123-123456789abc";
const config={clientId:"client.apps.googleusercontent.com",
 clientSecret:"not-production",redirectUri:"https://lms.example.com/api/mentor/google/callback"};
const input={meetingId:uuid,title:"Sprint planning",agenda:"Review next Sprint",
 startsAt:new Date("2026-11-10T08:00:00Z"),
 endsAt:new Date("2026-11-10T08:45:00Z"),timeZone:"Asia/Kolkata",
 inviteeEmails:["Learner@College.edu","learner@college.edu"],weeklyCount:4};
describe("Mentor Google Calendar real-provider bridge",()=>{
 it("requires HTTPS redirect and operator-provisioned OAuth credentials",()=>{
  expect(mentorGoogleConfig({})).toBeNull();
  expect(mentorGoogleConfig({MENTOR_GOOGLE_CLIENT_ID:config.clientId,
   MENTOR_GOOGLE_CLIENT_SECRET:config.clientSecret,
   MENTOR_GOOGLE_REDIRECT_URI:"http://attacker.example/callback"})).toBeNull();
  const url=new URL(mentorGoogleConsentUrl(config,"x".repeat(64)));
  expect(url.origin).toBe("https://accounts.google.com");
  expect(url.searchParams.get("scope")).toBe(
   "https://www.googleapis.com/auth/calendar.events");
  expect(url.searchParams.get("access_type")).toBe("offline");
  expect(()=>mentorGoogleConsentUrl(config,"unverified")).toThrow();
 });
 it("builds deterministic Meet request, real invites, reminders and recurrence",()=>{
  expect(mentorGoogleEventId(uuid)).toBe("m12345678123441238123123456789abc");
  const event=mentorGoogleEventBody(input);
  expect(event.attendees).toEqual([{email:"learner@college.edu"}]);
  expect(event.reminders.overrides).toEqual([
   {method:"email",minutes:60},{method:"popup",minutes:60}]);
  expect(event.recurrence).toEqual(["RRULE:FREQ=WEEKLY;COUNT=4"]);
  expect(event.conferenceData.createRequest.conferenceSolutionKey.type).toBe("hangoutsMeet");
 });
 it("never accepts injected attendees or unbounded recurrence",()=>{
  expect(()=>mentorGoogleEventBody({...input,inviteeEmails:["a@example.com\r\nBcc:bad"]}))
   .toThrow("GOOGLE_CALENDAR_INVITEE_INVALID");
  expect(()=>mentorGoogleEventBody({...input,weeklyCount:100}))
   .toThrow("GOOGLE_CALENDAR_RECURRENCE_INVALID");
  expect(()=>mentorGoogleEventBody({...input,endsAt:input.startsAt}))
   .toThrow("GOOGLE_CALENDAR_WINDOW_INVALID");
 });
 it("writes a saved event and bounds the generated Meet URL",async()=>{
  const mock=vi.fn(async()=>new Response(JSON.stringify({
   id:mentorGoogleEventId(uuid),etag:"etag1",hangoutLink:"https://meet.google.com/abc-xyz",
  }),{status:200,headers:{"Content-Type":"application/json"}}));
  const result=await mentorGoogleUpsertMeeting("token","primary",input,mock as typeof fetch);
  expect(result.meetUrl).toBe("https://meet.google.com/abc-xyz");
  const [url,options]=mock.mock.calls[0] as unknown as [string,RequestInit];
  expect(url).toContain("conferenceDataVersion=1&sendUpdates=all");
  expect(JSON.parse(String(options.body)).id).toBe(mentorGoogleEventId(uuid));
 });
 it("uses idempotent PUT after 409 and accepts no arbitrary video domain",async()=>{
  const mock=vi.fn()
   .mockResolvedValueOnce(new Response("",{status:409}))
   .mockResolvedValueOnce(new Response(JSON.stringify({
    id:mentorGoogleEventId(uuid),hangoutLink:"https://evil.example/meeting",
   }),{status:200}));
  const result=await mentorGoogleUpsertMeeting("token","primary",input,mock as typeof fetch);
  expect(result.meetUrl).toBeNull();
  expect(mock.mock.calls[1][1].method).toBe("PUT");
 });
 it("probes Events API and denies a token without Calendar permission",async()=>{
  const allowed=vi.fn(async()=>new Response(JSON.stringify({kind:"calendar#events"}),{status:200}));
  await expect(mentorGoogleVerifyCalendarAccess("token","primary",allowed as typeof fetch))
    .resolves.toBeUndefined();
  const [url,options]=allowed.mock.calls[0] as unknown as [string,RequestInit];
  expect(url).toContain("/calendars/primary/events?");
  expect(url).toContain("maxResults=1");
  expect(url).toContain("fields=kind");
  expect(options.method).toBe("GET");
  const denied=vi.fn(async()=>new Response("",{status:403}));
  await expect(mentorGoogleVerifyCalendarAccess("token","primary",denied as typeof fetch))
    .rejects.toThrow("GOOGLE_CALENDAR_ACCESS_REJECTED");
  const invalid=vi.fn(async()=>new Response(JSON.stringify({kind:"other"}),{status:200}));
  await expect(mentorGoogleVerifyCalendarAccess("token","primary",invalid as typeof fetch))
    .rejects.toThrow("GOOGLE_CALENDAR_ACCESS_INVALID");
 });
 it("fails closed on provider revocation and never treats 401 as success",async()=>{
  const bad=vi.fn(async()=>new Response("",{status:401}));
  await expect(mentorGoogleRefreshToken(config,"refresh",bad as typeof fetch))
   .rejects.toThrow("GOOGLE_CALENDAR_TOKEN_REJECTED");
  await expect(mentorGoogleRemoveMeeting("token","primary",uuid,bad as typeof fetch))
   .rejects.toThrow("GOOGLE_CALENDAR_DELETE_REJECTED");
 });
});
