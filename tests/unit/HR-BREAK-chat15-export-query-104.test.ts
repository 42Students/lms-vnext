import {beforeEach,describe,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({
 ctx:vi.fn(),activity:vi.fn(),notifications:vi.fn(),calendar:vi.fn(),
 job:vi.fn(),error:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:m.error}));
vi.mock("@/modules/placements/hr-job-activity-service",()=>({
 listRecruiterJobActivity:m.activity,
}));
vi.mock("@/modules/placements/hr-notifications-service",()=>({
 listHrNotifications:m.notifications,
}));
vi.mock("@/modules/placements/recruiter-calendar-service",()=>({
 listRecruiterCalendarEvents:m.calendar,
}));
vi.mock("@/modules/placements/hr-job-read-service",()=>({getHrJobRead:m.job}));
import {GET as activityGET} from "@/app/api/placements/recruiter/activity/export/route";
import {GET as notificationGET} from "@/app/api/placements/recruiter/notifications/export/route";
import {GET as calendarGET} from "@/app/api/placements/recruiter/calendar/export/route";
import {GET as applicantGET} from "@/app/api/placements/recruiter/jobs/[jobId]/applicants/export/route";
import {GET as offerGET} from "@/app/api/placements/recruiter/jobs/[jobId]/offers/export/route";
const jobId="123e4567-e89b-42d3-a456-426614174001";
const prefix="https://lms.example/api/placements/recruiter/";
const req=(tail:string)=>new Request(prefix+tail);
const jobContext={params:Promise.resolve({jobId})};
const handlers={
 activity:(query:string)=>activityGET(req("activity/export?"+query)),
 notifications:(query:string)=>notificationGET(req("notifications/export?"+query)),
 calendar:(query:string)=>calendarGET(req("calendar/export?"+query)),
 applicants:(query:string)=>applicantGET(req("jobs/"+jobId+"/applicants/export?"+query),jobContext),
 offers:(query:string)=>offerGET(req("jobs/"+jobId+"/offers/export?"+query),jobContext),
};
describe("HR-EXPORT-104 exact recruiter CSV query boundary",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue({user:{id:"actor",platformStatus:"ACTIVE"}});
  m.error.mockImplementation(()=>Response.json({error:"INVALID_REQUEST"},{status:400}));
 });
 it.each([
  ["activity","kind=ALL&kind=CLOSED"],["notifications","unreadOnly=false&unreadOnly=true"],
  ["calendar","date=2099-01-01&date=2099-02-02&view=week"],
  ["applicants","stage=APPLIED&stage=WITHDRAWN"],
  ["offers","offerState=ISSUED&offerState=REVOKED"],
 ] as const)("%s rejects duplicate sensitive filter before any grant lookup",async(area,query)=>{
  const response=await handlers[area](query);
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({error:"INVALID_QUERY"});
  expect(m.ctx).not.toHaveBeenCalled();
  expect(m.job).not.toHaveBeenCalled();
  expect(m.activity).not.toHaveBeenCalled();
  expect(m.notifications).not.toHaveBeenCalled();
  expect(m.calendar).not.toHaveBeenCalled();
 });
 it.each([
  ["activity","collegeId=abc&private=1"],
  ["notifications","unreadOnly=true&readAll=true"],
  ["calendar","date=2099-01-01&view=week&collegeId=foreign"],
  ["applicants","stage=ALL&includeContacts=1"],
  ["offers","offerState=ISSUED&admin=true"],
 ] as const)("%s refuses unexpected query fields without silently discarding them",async(area,query)=>{
  const response=await handlers[area](query);
  expect(response.status).toBe(400);
  expect(m.ctx).not.toHaveBeenCalled();
 });
});