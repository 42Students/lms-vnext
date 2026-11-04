import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";

const calls=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),email:vi.fn(),later:vi.fn(),
 mentorRead:vi.fn(),tpoRead:vi.fn(),projectSeen:vi.fn(),
 team:vi.fn(),cgpa:vi.fn(),skills:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:calls.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:calls.context}));
vi.mock("@/modules/projects/mentor-email-preference-service",
 ()=>({saveMentorEmailPreference:calls.email}));
vi.mock("@/modules/projects/mentor-attention-later-service",
 ()=>({markOwnMentorAttentionLater:calls.later}));
vi.mock("@/modules/activity/mentor-notification-read-service",
 ()=>({markAllOwnMentorNotificationsRead:calls.mentorRead}));
vi.mock("@/modules/activity/tpo-notifications-service",
 ()=>({markAllOwnTpoNotificationsRead:calls.tpoRead}));
vi.mock("@/modules/projects/mentor-activity-seen-service",
 ()=>({markMentorProjectActivitySeen:calls.projectSeen}));
vi.mock("@/modules/placements/tpo-settings-people-service",
 ()=>({getTpoPlacementTeam:calls.team}));
vi.mock("@/modules/profile-verification/settings-service",
 ()=>({setCollegeCgpaConversionRule:calls.cgpa}));
vi.mock("@/modules/skills/skill-source-import-service",
 ()=>({reconcileLegacySkillCatalog:calls.skills}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>NextResponse.json({error:"UNEXPECTED_ERROR"},{status:500}),
}));

import {POST as mentorEmail} from "@/app/api/mentor/preferences/email/route";
import {POST as mentorLater} from "@/app/api/mentor/attention/later/route";
import {POST as mentorReadAll} from "@/app/api/mentor/notifications/read-all/route";
import {POST as tpoReadAll} from "@/app/api/tpo/notifications/read-all/route";
import {POST as projectSeen} from "@/app/api/projects/[projectId]/activity/seen/route";
import {POST as cgpaRule} from "@/app/api/placements/tpo/settings/cgpa-rule/route";
import {POST as skillsImport} from "@/app/api/admin/skills/import/route";

const userId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const projectId="33333333-3333-4333-8333-333333333333";
const context={user:{id:userId},membership:{id:"member-a",collegeId}};
function req(route:string,body:string|Uint8Array){
 return new Request("https://college.test"+route,{
  method:"POST",
  headers:{host:"college.test",origin:"https://college.test",
   "content-type":"application/json"},body,
 });
}
const oversized=(max:number)=>" ".repeat(max+1);
const routeCases=[
 ["mentor email settings",256,"/api/mentor/preferences/email",mentorEmail,413,"INVALID_REQUEST",calls.email],
 ["mentor attention",1024,"/api/mentor/attention/later",mentorLater,413,"INVALID_BODY",calls.later],
 ["mentor read-all",512,"/api/mentor/notifications/read-all",mentorReadAll,413,"INVALID_BODY",calls.mentorRead],
 ["TPO read-all",512,"/api/tpo/notifications/read-all",tpoReadAll,413,"INVALID_BODY",calls.tpoRead],
 ["TPO CGPA policy",1000,"/api/placements/tpo/settings/cgpa-rule",cgpaRule,400,"INVALID_REQUEST",calls.cgpa],
 ["admin skill catalog import",210000,"/api/admin/skills/import",skillsImport,413,"SOURCE_TOO_LARGE",calls.skills],
] as const;
const projectRoute={params:Promise.resolve({projectId})};

beforeEach(()=>{
 vi.resetAllMocks();
 calls.origin.mockReturnValue(true);
 calls.context.mockResolvedValue(context);
 calls.email.mockResolvedValue({enabled:true,version:null});
 calls.later.mockResolvedValue({hidden:true});
 calls.mentorRead.mockResolvedValue({updated:1});
 calls.tpoRead.mockResolvedValue({updated:1});
 calls.projectSeen.mockResolvedValue({lastSeenAt:"2026-01-01T00:00:00.000Z"});
 calls.team.mockResolvedValue({members:[{membershipId:"member-a",roles:["TPO_ADMIN"]}]});
 calls.cgpa.mockResolvedValue({rule:"X10",recomputedMarks:0,updatedLearners:0});
 calls.skills.mockResolvedValue({imported:0});
});

describe("bounded request body security across staff and mentor mutations",()=>{
 for(const [label,max,url,handler,status,code,service] of routeCases){
  it(label+" rejects over-limit chunked-style input without touching tenant state",async()=>{
   const response=await handler(req(url,oversized(max)));
   expect(response.status).toBe(status);
   expect((await response.json()).error).toBe(code);
   expect(calls.context).not.toHaveBeenCalled();
   expect(service).not.toHaveBeenCalled();
  });
 }
 it("mentor project seen rejects an oversized body before resolving the actor",async()=>{
  const response=await projectSeen(
   req("/api/projects/"+projectId+"/activity/seen",oversized(256)),projectRoute);
  expect(response.status).toBe(413);
  expect(calls.context).not.toHaveBeenCalled();
  expect(calls.projectSeen).not.toHaveBeenCalled();
 });
 it("malformed UTF-8 in a body never reaches a domain service",async()=>{
  const invalid=new Uint8Array([0x7b,0xff,0x7d]);
  expect((await mentorEmail(req("/api/mentor/preferences/email",invalid))).status).toBe(400);
  expect((await tpoReadAll(req("/api/tpo/notifications/read-all",invalid))).status).toBe(400);
  expect((await skillsImport(req("/api/admin/skills/import",invalid))).status).toBe(400);
  expect(calls.context).not.toHaveBeenCalled();
 });
 it("legitimate small notification acknowledgement remains usable",async()=>{
  for(const [route,handler,service] of [
   ["/api/tpo/notifications/read-all",tpoReadAll,calls.tpoRead],
   ["/api/mentor/notifications/read-all",mentorReadAll,calls.mentorRead],
  ] as const){
   const response=await handler(req(route,"{}"));
   expect(response.status).toBe(200);
   expect(service).toHaveBeenCalledWith(context);
  }
 });
 it("legitimate bounded small mentor actions remain usable",async()=>{
  const email=await mentorEmail(req("/api/mentor/preferences/email",
   JSON.stringify({enabled:true,expectedVersion:null})));
  expect(email.status).toBe(200);
  expect(calls.email).toHaveBeenCalledWith(context,{enabled:true,expectedVersion:null});
  const later=await mentorLater(req("/api/mentor/attention/later",
   JSON.stringify({key:"attention:a111"})));
  expect(later.status).toBe(200);
  expect(calls.later).toHaveBeenCalledWith(context,"attention:a111");
  const seen=await projectSeen(req("/api/projects/"+projectId+"/activity/seen",""),projectRoute);
  expect(seen.status).toBe(200);
  expect(calls.projectSeen).toHaveBeenCalledWith(context,projectId);
 });
 it("legitimate TPO policy changes and catalog imports retain permission-service calls",async()=>{
  const cgpa=await cgpaRule(req("/api/placements/tpo/settings/cgpa-rule",JSON.stringify({rule:"X10"})));
  expect(cgpa.status).toBe(200);
  expect(calls.cgpa).toHaveBeenCalledWith(context,collegeId,"X10");
  const skills=await skillsImport(req("/api/admin/skills/import","{}"));
  expect(skills.status).toBe(200);
  expect(calls.skills).toHaveBeenCalledWith(context,{});
 });
 it("bounded UTF-8 reader rejects missing-Length multi-chunk streams at byte limit",async()=>{
  const stream=new ReadableStream<Uint8Array>({start(controller){
   controller.enqueue(new Uint8Array(200));
   controller.enqueue(new Uint8Array(100));
   controller.close();
  }});
  const request=new Request("https://college.test/api/read",{method:"POST",
   body:stream,duplex:"half"} as RequestInit&{duplex:"half"});
  expect(await readBoundedUtf8Body(request,256)).toEqual({kind:"TOO_LARGE"});
 });
});
