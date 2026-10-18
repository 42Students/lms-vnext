import {describe,expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import PlatformMarketingPage,{metadata as platformMetadata} from "@/app/platform/page";
import EnterprisesPage,{metadata as enterpriseMetadata} from "@/app/enterprises/page";
import UniversitiesPage,{metadata as universityMetadata} from "@/app/universities/page";
import RootError from "@/app/error";
import GlobalError from "@/app/global-error";
import RootNotFound from "@/app/not-found";
import RootLoading from "@/app/loading";

describe("chat-16 real public platform and root recovery page rendering",()=>{
 it("UX-chat16-platform-16 describes existing learning, projects and placements rather than dropped AI agents",()=>{
  const html=renderToStaticMarkup(<PlatformMarketingPage/>);
  expect(platformMetadata.title).toBe("Platform | 42 LMS");
  expect(html).toContain("One connected platform for learning, projects and placements.");
  for(const title of ["Learner workspace","Faculty workspace","Mentor workspace",
   "Placement workspace","HR workspace","Administrator"]){
   expect(html).toContain(title);
  }
  for(const pillar of ["Learning","Projects","Placements","Integrations"]){
   expect(html).toContain(pillar);
  }
  expect(html).not.toContain("autonomous AI");
  expect(html).not.toContain("AI agent");
  expect(html).toContain('href="/request-demo"');
 });
 it("UX-chat16-public-marketing-21 describes current university and employer workflows without invented AI delivery",()=>{
  const university=renderToStaticMarkup(<UniversitiesPage/>);
  const enterprise=renderToStaticMarkup(<EnterprisesPage/>);
  expect(universityMetadata.description).toBe("Develop employable graduates through learning and placements.");
  expect(enterpriseMetadata.description).toBe("Build stronger workforces through learning and hiring.");
  expect(university).toContain("Develop employable graduates through learning and placements");
  expect(enterprise).toContain("Build stronger workforces through learning and hiring");
  for(const html of [university,enterprise]){
   expect(html).not.toContain("with AI");
   expect(html).toContain('href="/request-demo"');
   expect(html).toContain('aria-label="Public navigation"');
  }
 });
 it("UX-chat16-errors-17 never renders provider exceptions, stack traces, or private digest values",()=>{
  const error=Object.assign(new Error("internal SMTP password, SQL stack and private recruiter address"),{
   digest:"sensitive-internal-digest",
  });
  const root=renderToStaticMarkup(<RootError error={error} reset={()=>{}}/>);
  const global=renderToStaticMarkup(<GlobalError error={error} reset={()=>{}}/>);
  for(const html of [root,global]){
   expect(html).toContain("This page is temporarily unavailable");
   expect(html).toContain("Try again");
   expect(html).toContain('href="/"');
   expect(html).not.toContain("internal SMTP password");
   expect(html).not.toContain("private recruiter address");
   expect(html).not.toContain("sensitive-internal-digest");
  }
  expect(global).toContain('<html lang="en">');
  expect(global).toContain("<body>");
 });
 it("UX-chat16-errors-18 failed chunk load has a recoverable update state without leaking error",()=>{
  const error=new Error("ChunkLoadError: private module path");
  const markup=renderToStaticMarkup(<RootError error={error} reset={()=>{}}/>);
  expect(markup).toContain("Updating your page");
  expect(markup).toContain("A new version is available");
  expect(markup).not.toContain("private module path");
  expect(markup).toContain("Try again");
 });
 it("UX-chat16-not-found-19 renders a first-party recovery route instead of a redirect loop",()=>{
  const html=renderToStaticMarkup(<RootNotFound/>);
  expect(html).toContain("Page not found");
  expect(html).toContain('href="/"');
  expect(html).toContain("Go to home");
 });
 it("UX-chat16-loading-20 displays visible, accessible loading affordances",()=>{
  const html=renderToStaticMarkup(<RootLoading/>);
  expect(html).toContain("Loading your page");
  expect(html).toContain('data-slot=');
  expect(html).not.toContain("undefined");
 });
});