import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactElement,type ReactNode} from "react";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import HomePage,{generateMetadata} from "@/app/page";
import LoginPage from "@/app/login/page";
import {getCurrentRequestContext} from "@/auth/request-context";
import {resolveRequestTenant} from "@/modules/auth/request-tenant";
import {getPublicCollegeBranding} from "@/modules/colleges/branding-service";
import {effectiveCollegeSignInCapabilities} from "@/modules/colleges/public-signin-policy-service";
import {LoginForm} from "@/components/auth/login-form";

vi.mock("next/headers",()=>({headers:vi.fn()}));
vi.mock("next/navigation",()=>({
 redirect:vi.fn((path:string)=>{throw new Error("REDIRECT:"+path);}),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/modules/auth/request-tenant",()=>({resolveRequestTenant:vi.fn()}));
vi.mock("@/modules/colleges/branding-service",()=>({getPublicCollegeBranding:vi.fn()}));
vi.mock("@/modules/colleges/public-signin-policy-service",()=>({
 effectiveCollegeSignInCapabilities:vi.fn(),
}));
vi.mock("@/components/auth/login-form",()=>({LoginForm:()=>null}));

function elements(node:ReactNode):ReactElement[]{
 if(Array.isArray(node))return node.flatMap(elements);
 if(!isValidElement(node))return [];
 return [node,...elements((node.props as {children?:ReactNode}).children)];
}
function textOf(node:ReactNode):string{
 if(typeof node==="string")return node;
 if(Array.isArray(node))return node.map(textOf).join(" ");
 if(isValidElement(node))return textOf((node.props as {children?:ReactNode}).children);
 return "";
}
const params=(search:Record<string,string|string[]|undefined>={})=>({searchParams:Promise.resolve(search)});
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(headers).mockResolvedValue({get:(name:string)=>name==="host"?"42lms.com":name==="x-lms-path"?"/login":null} as Awaited<ReturnType<typeof headers>>);
 vi.mocked(getCurrentRequestContext).mockRejectedValue(new Error("no session"));
 vi.mocked(resolveRequestTenant).mockResolvedValue({kind:"platform",host:"42lms.com"});
 vi.mocked(getPublicCollegeBranding).mockResolvedValue(null);
 vi.mocked(effectiveCollegeSignInCapabilities).mockResolvedValue({email:true,phone:true,primary:"EMAIL"});
});

describe("chat-16 real public sign-in page security and tenant rendering",()=>{
 it("UX-chat16-auth-platform-01 routes anonymous marketing traffic away from OTP, but keeps /login reachable",async()=>{
  vi.mocked(headers).mockResolvedValue({get:(name:string)=>name==="host"?"42lms.com":name==="x-lms-path"?"/":null} as Awaited<ReturnType<typeof headers>>);
  await expect(HomePage(params())).rejects.toThrow("REDIRECT:/home");
  vi.mocked(headers).mockResolvedValue({get:(name:string)=>name==="host"?"42lms.com":name==="x-lms-path"?"/login":null} as Awaited<ReturnType<typeof headers>>);
  const page=await LoginPage(params());
  expect(elements(page).some(el=>el.type===LoginForm)).toBe(true);
  expect(vi.mocked(effectiveCollegeSignInCapabilities)).toHaveBeenCalledWith(null);
 });
 it("UX-chat16-auth-college-02 obtains host-scoped branding and allowed OTP channels",async()=>{
  vi.mocked(resolveRequestTenant).mockResolvedValue({
   kind:"college",host:"portal.example.edu",collegeId:"college-1",organizationId:"org-1",
  });
  vi.mocked(getPublicCollegeBranding).mockResolvedValue({
   collegeName:"Example College",logoUrl:null,faviconUrl:null,loginBackgroundUrl:null,
   loginBackgroundUrlMobile:null,primaryColor:null,secondaryColor:null,
   supportEmail:null,supportPhone:null,termsUrl:null,privacyUrl:null,version:0,
  });
  vi.mocked(effectiveCollegeSignInCapabilities).mockResolvedValue({email:true,phone:false,primary:"EMAIL"});
  const page=await HomePage(params({recruiter:"email"}));
  expect(textOf(page)).toContain("Example College");
  const login=elements(page).find(el=>el.type===LoginForm);
  expect(login).toBeDefined();
  expect(login?.props).toMatchObject({allowedChannels:["EMAIL"],defaultChannel:"EMAIL"});
  expect(getPublicCollegeBranding).toHaveBeenCalledWith("college-1");
  expect(effectiveCollegeSignInCapabilities).toHaveBeenCalledWith("college-1");
 });
 it("UX-chat16-auth-unknown-03 fails closed for unrecognized domains with a recovery link",async()=>{
  vi.mocked(resolveRequestTenant).mockResolvedValue({kind:"unknown",host:"unknown.example.edu"});
  const page=await HomePage(params({auth:"expired"}));
  expect(textOf(page)).toContain("This address isn");
  expect(textOf(page)).toContain("Your session expired. Please log in again.");
  expect(elements(page).some(el=>el.type===LoginForm)).toBe(false);
 });
 it("UX-chat16-auth-signed-in-04 redirects to an internal return path and rejects an external destination",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue({
   user:{id:"u",identityUid:"uid",platformStatus:"ACTIVE",systemRoles:[]},membership:null,
  });
  await expect(HomePage(params({returnTo:"/dashboard?tab=one"}))).rejects.toThrow("REDIRECT:/dashboard?tab=one");
  await expect(HomePage(params({returnTo:"https://attacker.example.org"}))).rejects.toThrow("REDIRECT:/dashboard");
  expect(redirect).toHaveBeenCalledTimes(2);
 });
 it("UX-chat16-auth-unavailable-06 never shows a tenant OTP form after a domain lookup outage",async()=>{
  vi.mocked(resolveRequestTenant).mockResolvedValue({kind:"unavailable",host:"college.example.edu"});
  const page=await HomePage(params());
  expect(textOf(page)).toContain("This address may be correct");
  expect(textOf(page)).toContain("We couldn");
  expect(elements(page).some(el=>el.type===LoginForm)).toBe(false);
  const links=elements(page).filter(el=>el.type==="a");
  expect(links.some(el=>(el.props as {href?:string}).href==="https://42lms.com/login")).toBe(true);
 });
 it("UX-chat16-auth-recovery-07 explains expired, revoked and legacy handoff sessions without exposing tokens",async()=>{
  for(const [auth,fragment] of [
   ["revoked","Your session was ended"],
   ["expired","Your session expired. Please log in again."],
   ["handoff-retired","This old sign-in link has changed"],
  ] as const){
   const page=await HomePage(params({auth}));
   expect(textOf(page)).toContain(fragment);
   expect(elements(page).some(el=>(el.props as {role?:string}).role==="alert")).toBe(true);
   expect(textOf(page)).not.toContain("private-auth-secret");
  }
 });
 it("UX-chat16-auth-recruiter-08 does not override a tenant that disables email OTP",async()=>{
  vi.mocked(resolveRequestTenant).mockResolvedValue({
   kind:"college",host:"college.example.edu",collegeId:"college-1",organizationId:"org-1",
  });
  vi.mocked(effectiveCollegeSignInCapabilities).mockResolvedValue({
   email:false,phone:true,primary:"PHONE",
  });
  const page=await HomePage(params({recruiter:"email"}));
  const login=elements(page).find(el=>el.type===LoginForm);
  expect(login?.props).toMatchObject({defaultChannel:"PHONE",allowedChannels:["PHONE"]});
 });
 it("UX-chat16-auth-metadata-05 reads verified tenant rather than forwarded-host headers",async()=>{
  await expect(generateMetadata()).resolves.toMatchObject({title:"Sign in · 42LMS"});
  expect(resolveRequestTenant).toHaveBeenCalledWith("42lms.com");
 });
});
