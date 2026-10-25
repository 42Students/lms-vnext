import {beforeEach,describe,expect,it,vi} from "vitest";
const fake=vi.hoisted(()=>({
 context:vi.fn(),connection:vi.fn(),access:vi.fn(),probe:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:fake.context}));
vi.mock("@/modules/projects/mentor-google-calendar-connection-service",()=>({
 mentorGoogleConnectionState:fake.connection,
 getMentorGoogleAccessToken:fake.access,
}));
vi.mock("@/modules/projects/mentor-google-calendar-provider",()=>({
 mentorGoogleVerifyCalendarAccess:fake.probe,
}));
import {POST} from "@/app/api/mentor/calendar/google/verify/route";
function request(origin="https://lms.example"){
 return new Request("https://lms.example/api/mentor/calendar/google/verify",{
  method:"POST",headers:{host:"lms.example",origin},
 });
}
describe("Mentor Google grant verification boundary",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  fake.context.mockResolvedValue({user:{id:"private-user"}});
  fake.connection.mockResolvedValue({connected:true,available:true,
   connectedAt:"2026-10-25T00:00:00Z"});
  fake.access.mockResolvedValue({accessToken:"secret-google-access-token",calendarId:"primary"});
  fake.probe.mockResolvedValue(undefined);
 });
 it("rejects cross-origin writes before reading credentials",async()=>{
  const response=await POST(request("https://attacker.example"));
  expect(response.status).toBe(403);
  expect(fake.context).not.toHaveBeenCalled();
  expect(fake.access).not.toHaveBeenCalled();
 });
 it("never probes Google when no consented grant is saved",async()=>{
  fake.connection.mockResolvedValue({connected:false,available:true,connectedAt:null});
  const response=await POST(request());
  expect(response.status).toBe(409);
  expect(fake.access).not.toHaveBeenCalled();
 });
 it("checks a fresh provider token and returns no credentials",async()=>{
  const response=await POST(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({verified:true});
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(fake.access).toHaveBeenCalledTimes(1);
  expect(fake.probe).toHaveBeenCalledWith("secret-google-access-token","primary");
 });
 it("rejects tokens without live Calendar events permission",async()=>{
  fake.probe.mockRejectedValue(new Error("private provider detail"));
  const response=await POST(request());
  expect(response.status).toBe(502);
  const payload=await response.text();
  expect(payload).toContain("GOOGLE_CALENDAR_VERIFICATION_FAILED");
  expect(payload).not.toContain("private provider detail");
 });
 it("fails closed when Google rejects or cannot refresh the grant",async()=>{
  fake.access.mockRejectedValue(new Error("secret-refresh-token"));
  const response=await POST(request());
  expect(response.status).toBe(502);
  const payload=await response.text();
  expect(payload).toContain("GOOGLE_CALENDAR_VERIFICATION_FAILED");
  expect(payload).not.toContain("secret-refresh-token");
  expect(payload).not.toContain("secret-google-access-token");
 });
});
