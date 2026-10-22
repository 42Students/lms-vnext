import {describe,expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import HomeMarketingPage,{metadata as homeMetadata} from "@/app/home/page";
import UniversitiesPage,{metadata as universitiesMetadata} from "@/app/universities/page";
import EnterprisesPage,{metadata as enterprisesMetadata} from "@/app/enterprises/page";
import RequestDemoPage,{metadata as demoMetadata} from "@/app/request-demo/page";
import ForbiddenPage,{metadata as forbiddenMetadata} from "@/app/forbidden/page";

describe("chat-16 public and auth-adjacent page rendering",()=>{
 it("UX-chat16-public-home-01 offers functional, named destinations without requiring an account",()=>{
  const html=renderToStaticMarkup(<HomeMarketingPage/>);
  expect(homeMetadata.title).toEqual({absolute:"42 LMS — Learning, Projects and Placements"});
  for(const href of ["/","/platform","/universities","/enterprises","/request-demo","/login","/privacy-policy"]){
   expect(html).toContain('href="'+href+'"');
  }
  expect(html).toContain("Build employable graduates. Create stronger talent pipelines.");
  expect(html).toContain('aria-label="Public navigation"');
  expect(html).toContain('application/ld+json');
 });
 it("UX-chat16-public-universities-02 provides a campus-specific overview and next step",()=>{
  const html=renderToStaticMarkup(<UniversitiesPage/>);
  expect(universitiesMetadata.title).toBe("For Universities — 42 LMS");
  expect(html).toContain("For Universities");
  expect(html).toContain("Recruitment");
  expect(html).toContain("Administration");
  expect(html).toContain('href="/request-demo"');
  expect(html).toContain('aria-label="Campus capabilities"');
 });
 it("UX-chat16-public-enterprises-03 reaches hiring and learning overviews without login",()=>{
  const html=renderToStaticMarkup(<EnterprisesPage/>);
  expect(enterprisesMetadata.title).toEqual({absolute:"For Enterprises — 42 LMS"});
  expect(html).toContain("For Enterprises");
  expect(html).toContain("Connected learning and hiring workflows");
  expect(html).toContain("Recruiting Operations");
  expect(html).toContain('href="/request-demo"');
  expect(html).toContain('aria-label="Enterprise outcomes"');
 });
 it("UX-chat16-public-demo-04 retains explicit contact and no hidden form submission",()=>{
  const html=renderToStaticMarkup(<RequestDemoPage/>);
  expect(demoMetadata.title).toBe("Request a Demo — 42 LMS");
  expect(html).toContain("See 42 LMS in action");
  expect(html).toContain("What to expect");
  expect(html).toContain('href="mailto:hello@42lms.com?subject=Request%20a%20Demo"');
  expect(html).toContain("No form data is collected on this page.");
  expect(html).not.toContain("<form");
 });
 it("UX-chat16-forbidden-05 presents a non-indexed recovery page instead of looping",()=>{
  const html=renderToStaticMarkup(<ForbiddenPage/>);
  expect(forbiddenMetadata.title).toBe("You do not have access to this page | 42LMS");
  expect(forbiddenMetadata.robots).toEqual({index:false,follow:false});
  expect(html).toContain("You do not have access to this page");
  expect(html).toContain("contact your administrator");
  expect(html).toContain('href="/dashboard"');
 });
});
