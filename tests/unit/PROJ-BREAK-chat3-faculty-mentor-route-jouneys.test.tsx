import React from "react";
import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {RequestContext} from "@/modules/identity/context";

vi.mock("server-only",()=>({}));
const mocks=vi.hoisted(()=>({context:vi.fn(),redirect:vi.fn()}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:mocks.context,
}));
vi.mock("next/navigation",()=>({
 redirect:mocks.redirect,
}));
import MentorLayout from "@/app/(authenticated)/mentor/layout";
import TeacherLayout from "@/app/(authenticated)/teacher/layout";

const collegeId="11111111-1111-4111-8111-111111111111";
const orgId="22222222-2222-4222-8222-222222222222";
function principal(roles:RequestContext["membership"] extends infer M ? readonly ("FACULTY"|"MENTOR"|"LEARNER")[]:never,
 status:"ACTIVE"|"SUSPENDED"="ACTIVE",platformStatus:"ACTIVE"|"DISABLED"="ACTIVE"):RequestContext{
 return {
  user:{id:"person",identityUid:"identity",platformStatus,systemRoles:[]},
  membership:{id:"member",collegeId,organizationId:orgId,status,roles},
 };
}
const content=React.createElement("p",null,"Role-private projects content");
beforeEach(()=>{
 vi.resetAllMocks();
 mocks.redirect.mockImplementation((path:string)=>{throw new Error("REDIRECT:"+path);});
});
describe("PROJ-BREAK-chat3-FACULTY-02 mentor and teacher route isolation",()=>{
 it("does not give a Faculty-only identity Mentor workspace access",async()=>{
  mocks.context.mockResolvedValue(principal(["FACULTY"]));
  await expect(MentorLayout({children:content}))
   .rejects.toThrow("REDIRECT:/dashboard");
  expect(mocks.context).toHaveBeenCalledOnce();
 });
 it("does not give a Mentor-only identity Teacher lessons access",async()=>{
  mocks.context.mockResolvedValue(principal(["MENTOR"]));
  await expect(TeacherLayout({children:content}))
   .rejects.toThrow("REDIRECT:/dashboard");
 });
 it("denies suspended roles and disabled identities at both route boundaries",async()=>{
  for(const context of [
   principal(["FACULTY","MENTOR"],"SUSPENDED"),
   principal(["FACULTY","MENTOR"],"ACTIVE","DISABLED"),
   principal(["LEARNER"]),
  ]){
   mocks.context.mockResolvedValue(context);
   await expect(MentorLayout({children:content}))
    .rejects.toThrow("REDIRECT:/dashboard");
   await expect(TeacherLayout({children:content}))
    .rejects.toThrow("REDIRECT:/dashboard");
  }
 });
 it("grants a dual-role active Faculty/Mentor each route while preserving the Faculty skip target",async()=>{
  mocks.context.mockResolvedValue(principal(["FACULTY","MENTOR"]));
  await expect(MentorLayout({children:content})).resolves.toBe(content);
  const page=await TeacherLayout({children:content});
  const html=renderToStaticMarkup(page);
  expect(html).toContain('href="#faculty-page-content"');
  expect(html).toContain('id="faculty-page-content"');
  expect(html).toContain("Role-private projects content");
  expect(mocks.redirect).not.toHaveBeenCalled();
 });
});
