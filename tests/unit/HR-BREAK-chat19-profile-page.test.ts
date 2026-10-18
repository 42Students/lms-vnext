import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
import type {RequestContext} from "@/modules/identity/context";

const m=vi.hoisted(()=>({ctx:vi.fn(),profile:vi.fn(),grants:vi.fn(),redirect:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/modules/placements/recruiter-profile-service",()=>({getRecruiterSelfProfile:m.profile}));
vi.mock("@/modules/placements/recruiter-self-grants-service",()=>({getRecruiterSelfGrantOverview:m.grants}));
vi.mock("next/navigation",()=>({redirect:m.redirect}));
import HrProfilePage from "@/app/(authenticated)/hr/profile/page";

const actor:RequestContext={
 user:{id:"recruiter",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:"recruiter",companyId:"company",companyName:"Authorized employer",
  title:null,status:"ACTIVE",grants:[]},
};
const profile={
 displayName:"Ananya Rao",title:"HR recruiter",contactPhoneDigits:"",contactReady:true,
 userUpdatedAt:new Date("2026-10-18T10:00:00Z"),
 profileUpdatedAt:new Date("2026-10-18T10:00:00Z"),
 email:"ananya@example.com",companyName:"Authorized employer",grants:[],
};
function collect(node:ReactNode):string{
 if(Array.isArray(node))return node.map(collect).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const p=node.props as {title?:string;description?:string;children?:ReactNode};
 return [p.title??"",p.description??"",collect(p.children)].join(" ");
}

describe("HR-BREAK-chat19-profile-page: active recruiter reads and session denial",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  m.profile.mockResolvedValue(profile);
  m.grants.mockResolvedValue({profileStatus:"ACTIVE",grants:[]});
 });
 it("denies an expired session before profile/college access reads",async()=>{
  m.ctx.mockResolvedValue({...actor,user:{...actor.user,platformStatus:"DISABLED"}});
  await expect(HrProfilePage()).rejects.toThrow("REDIRECT");
  expect(m.redirect).toHaveBeenCalledWith("/dashboard");
  expect(m.profile).not.toHaveBeenCalled();
  expect(m.grants).not.toHaveBeenCalled();
 });
 it("denies a removed recruiter independently of college membership",async()=>{
  m.ctx.mockResolvedValue({...actor,recruiter:null});
  await expect(HrProfilePage()).rejects.toThrow("REDIRECT");
  expect(m.profile).not.toHaveBeenCalled();
 });
 it("HR-BREAK-PROFILE-IDENTITY-10 rejects mismatched recruiter identity before profile and grant reads",async()=>{
  m.ctx.mockResolvedValue({...actor,recruiter:{...actor.recruiter!,userId:"another-employee"}});
  await expect(HrProfilePage()).rejects.toThrow("REDIRECT");
  expect(m.redirect).toHaveBeenCalledWith("/dashboard");
  expect(m.profile).not.toHaveBeenCalled();
  expect(m.grants).not.toHaveBeenCalled();
 });
 it("shows only the authenticated recruiter's own email and employer from service projections",async()=>{
  const result=await HrProfilePage();
  const text=collect(result);
  expect(m.profile).toHaveBeenCalledWith(actor);
  expect(m.grants).toHaveBeenCalledWith(actor);
  expect(text).toContain("ananya@example.com");
  expect(text).toContain("Authorized employer");
  expect(text).toContain("College access");
  expect(text).toContain("You sign in with this");
 });
 it("requires service projection to succeed and never silently reuses a stale profile cache",async()=>{
  m.profile.mockRejectedValue(new Error("profile unavailable"));
  await expect(HrProfilePage()).rejects.toThrow("profile unavailable");
  expect(m.grants).not.toHaveBeenCalled();
 });
});

describe("HR-BREAK-PROFILE-SCOPE-44 private profile state isolation",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.profile.mockResolvedValue(profile);
  m.grants.mockResolvedValue({profileStatus:"ACTIVE",grants:[]});
 });
 it("changes client form identity between logged-in recruiters before reusing unsent private data",async()=>{
  const source=await import("node:fs");
  const code=source.readFileSync("src/app/(authenticated)/hr/profile/page.tsx","utf8");
  expect(code).toContain('RecruiterProfileDetailsEditor key={context.user.id}');
  expect(code).toContain('key={context.user.id+":"+profile.grants.map(grant=>grant.id).join(",")}');
 });
 it("the server does not expose the previous actor's profile on a newly authorized actor",async()=>{
  const otherActor={...actor,user:{...actor.user,id:"other"},recruiter:{...actor.recruiter!,userId:"other"}};
  const otherProfile={...profile,displayName:"Other Recruiter",email:"other@example.com",companyName:"Other employer"};
  m.ctx.mockResolvedValue(otherActor);
  m.profile.mockResolvedValue(otherProfile);
  const result=await HrProfilePage();
  expect(collect(result)).toContain("other@example.com");
  expect(collect(result)).not.toContain("ananya@example.com");
  expect(m.profile).toHaveBeenCalledWith(otherActor);
 });
});
