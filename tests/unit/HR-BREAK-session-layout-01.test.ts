import {beforeEach,describe,expect,it,vi} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import type {RequestContext} from "@/modules/identity/context";

const harness=vi.hoisted(()=>({request:vi.fn(),redirect:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:harness.request}));
vi.mock("next/navigation",()=>({redirect:harness.redirect}));
import HrLayout from "@/app/(authenticated)/hr/layout";

const college="123e4567-e89b-42d3-a456-426614174001";
const user="123e4567-e89b-42d3-a456-426614174002";
const authorized:RequestContext={
 user:{id:user,identityUid:"test-identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:user,companyId:"employer-a",companyName:"Employer A",
  title:null,status:"ACTIVE",grants:[{id:"g-1",organizationId:"org-1",collegeId:college,
   collegeName:"College A",companyRelationshipId:"relation-a"}]},
};

describe("HR-BREAK-session-layout-01: recruiter route entry under role and session changes",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  harness.request.mockResolvedValue(authorized);
  harness.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
 });
 it("renders exactly the authorized child for a live recruiter",async()=>{
  const child=createElement("p",null,"Authorized HR content");
  const markup=renderToStaticMarkup(await HrLayout({children:child}));
  expect(markup).toContain("Authorized HR content");
  expect(markup).toContain('href="#hr-page-content"');
  expect(markup).toContain('id="hr-page-content"');
  expect(harness.redirect).not.toHaveBeenCalled();
 });
 it.each([
  ["expired or disabled user",{...authorized,user:{...authorized.user,platformStatus:"DISABLED"}}],
  ["deleted recruiter",{...authorized,recruiter:null}],
  ["suspended recruiter",{...authorized,recruiter:{...authorized.recruiter,status:"SUSPENDED"}}],
  ["missing session",null],
 ])("denies %s before rendering any HR child",async(_reason,context)=>{
  harness.request.mockResolvedValue(context);
  await expect(HrLayout({children:createElement("p",null,"Private")})).rejects.toThrow("REDIRECT");
  expect(harness.redirect).toHaveBeenCalledWith("/dashboard");
 });
 it("empty current grant list is allowed to render a no-access recovery page, not implicit access",async()=>{
  harness.request.mockResolvedValue({...authorized,recruiter:{...authorized.recruiter!,grants:[]}});
  const child=createElement("p",null,"No college access");
  const markup=renderToStaticMarkup(await HrLayout({children:child}));
  expect(markup).toContain("No college access");
  expect(markup).toContain('id="hr-page-content"');
  expect(harness.redirect).not.toHaveBeenCalled();
 });
});
