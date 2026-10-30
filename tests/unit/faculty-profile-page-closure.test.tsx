import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
const fakes=vi.hoisted(()=>({
 context:vi.fn(),identity:vi.fn(),ready:vi.fn(),document:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("next/navigation",()=>({
 redirect:(to:string)=>{throw new Error("REDIRECT_"+to);},
 notFound:()=>{throw new Error("NOT_FOUND");},
 useRouter:()=>({refresh:vi.fn(),push:vi.fn(),replace:vi.fn()}),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:fakes.context}));
vi.mock("@/modules/people/runtime",()=>({getOwnFacultyProfileWithRuntime:fakes.identity}));
vi.mock("@/modules/people/faculty-profile-readiness",()=>({
 facultyProfileDocumentStorageReady:fakes.ready,
}));
vi.mock("@/modules/people/faculty-profile-self.staged",()=>({
 loadOwnFacultyProfileDocumentStaged:fakes.document,
}));
// The avatar remains an independent, private endpoint. This test only checks
// the server page and does not touch a real provider or identity document.
vi.mock("@/components/people/faculty-avatar-upload",()=>({
 FacultyAvatarUpload:({initials}:{initials:string})=><div>Avatar {initials}</div>,
}));
import Page from "@/app/(authenticated)/teacher/profile/page";
import Loading from "@/app/(authenticated)/teacher/profile/loading";
import ErrorBoundary from "@/app/(authenticated)/teacher/profile/error";

const faculty={
 user:{id:"teacher",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"my-membership",status:"ACTIVE",roles:["FACULTY"],
  collegeId:"my-college",organizationId:"my-org"},
};
async function html(){
 return renderToStaticMarkup(await Page({searchParams:Promise.resolve({})}));
}
beforeEach(()=>{
 vi.resetAllMocks();
 fakes.context.mockResolvedValue(faculty);
 fakes.identity.mockResolvedValue({
  person:{user:{displayName:"Faculty Example",email:"faculty@example.invalid",phoneE164:null}},
  profile:{academicTitle:"Professor",employmentType:"FULL_TIME"},
 });
 fakes.ready.mockResolvedValue(false);
});
describe("Faculty profile account page closure",()=>{
 it("shows accessible loading and safe hard-error Retry UI without leaking the failure",()=>{
  const loading=renderToStaticMarkup(<Loading/>);
  expect(loading).toContain("Loading faculty profile");
  const hardError=renderToStaticMarkup(<ErrorBoundary error={new Error("sensitive profile read failure")} reset={()=>{}}/>);
  expect(hardError).toContain("Unable to load your profile");
  expect(hardError).toContain("Retry");
  expect(hardError).toContain("/teacher/courses");
  expect(hardError).not.toContain("sensitive profile read failure");
 });
 it("keeps verified identity and teaching metadata visible when private document storage is not yet enabled",async()=>{
  const text=await html();
  expect(text).toContain("Faculty Example");
  expect(text).toContain("faculty@example.invalid");
  expect(text).toContain("Professor");
  expect(text).toContain("Profile editing unavailable");
  expect(text).toContain("Profile completeness");
  expect(text).not.toContain("Edit Experiences");
  expect(fakes.document).not.toHaveBeenCalled();
 });
 it("does not erase a healthy profile when a private-document section fetch fails",async()=>{
  fakes.ready.mockResolvedValue(true);
  fakes.document.mockRejectedValue(new Error("private database credentials leaked"));
  const text=await html();
  expect(text).toContain("Faculty Example");
  expect(text).toContain("Profile sections temporarily unavailable");
  expect(text).toContain("Retry to load your last saved details");
  expect(text).not.toContain("private database credentials leaked");
  expect(text).not.toContain("No experiences found");
 });
 it("protects readiness failures without pretending the profile is empty",async()=>{
  fakes.ready.mockRejectedValue(new Error("private migration state"));
  const text=await html();
  expect(text).toContain("Faculty Example");
  expect(text).toContain("Profile sections temporarily unavailable");
  expect(text).not.toContain("private migration state");
 });
 it("makes initial source failure recoverable without exposing the error",async()=>{
  fakes.identity.mockRejectedValue(new Error("sensitive runtime error"));
  const text=await html();
  expect(text).toContain("Couldn&#x27;t refresh profile");
  expect(text).toContain("Refresh profile");
  expect(text).not.toContain("sensitive runtime error");
 });
 it.each([
  {roles:["LEARNER"],target:"REDIRECT_/learn/profile"},
  {roles:["COLLEGE_ADMIN"],target:"REDIRECT_/college/profile"},
  {roles:["MENTOR"],target:"NOT_FOUND"},
  {roles:["TPO"],target:"NOT_FOUND"},
 ])("separates %j from the Faculty self profile",async({roles,target})=>{
  fakes.context.mockResolvedValue({...faculty,membership:{...faculty.membership,roles}});
  await expect(html()).rejects.toThrow(target);
  expect(fakes.identity).not.toHaveBeenCalled();
 });
 it("denies suspended or revoked memberships before reading profile fields",async()=>{
  fakes.context.mockResolvedValue({...faculty,membership:{...faculty.membership,status:"SUSPENDED"}});
  await expect(html()).rejects.toThrow("NOT_FOUND");
  expect(fakes.identity).not.toHaveBeenCalled();
 });
});
