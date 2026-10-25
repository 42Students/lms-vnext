import {describe,expect,it,vi} from "vitest";
import {mentorGoogleMeetingFollowUp} from
 "@/components/projects/mentor-google-meeting-follow-up";
describe("Mentor post-commit Google meeting updates",()=>{
 const project="11111111-1111-4111-8111-111111111111";
 const meeting="22222222-2222-4222-8222-222222222222";
 it("attempts Google DELETE only for a committed cancellation",async()=>{
  const mock=vi.fn(async()=>new Response(JSON.stringify({removed:true}),{status:200}));
  expect(await mentorGoogleMeetingFollowUp(project,meeting,"CANCEL",mock as typeof fetch))
   .toBe(true);
  const [url,options]=mock.mock.calls[0] as unknown as [string,RequestInit];
  expect(url).toContain("/meetings/"+meeting+"/google");
  expect(options.method).toBe("DELETE");
  expect(options.credentials).toBe("same-origin");
 });
 it("never treats local reschedule or a provider failure as delivered invites",async()=>{
  const accepted=vi.fn(async()=>new Response(JSON.stringify({
   meetingScheduled:true,invitationStatus:"PROVIDER_ACCEPTED",
  }),{status:200}));
  expect(await mentorGoogleMeetingFollowUp(project,meeting,"RESCHEDULE",accepted as typeof fetch))
   .toBe(true);
  const [_,options]=accepted.mock.calls[0] as unknown as [string,RequestInit];
  expect(options.method).toBe("POST");
  const fail=vi.fn(async()=>new Response("",{status:503}));
  expect(await mentorGoogleMeetingFollowUp(project,meeting,"RESCHEDULE",fail as typeof fetch))
   .toBe(false);
  const uncertain=vi.fn(async()=>new Response(JSON.stringify({
   meetingScheduled:true,invitationStatus:"RETRY_REQUIRED",
  }),{status:200}));
  expect(await mentorGoogleMeetingFollowUp(project,meeting,"RESCHEDULE",uncertain as typeof fetch))
   .toBe(false);
 });
});
