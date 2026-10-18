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
  expect(homeMetadata.title).toBe("42 LMS | Talent development");
  for(const href of ["/home","/platform","/universities","/enterprises","/request-demo","/login","/privacy-policy"]){
   expect(html).toContain('href="'+href+'"');
  }
  expect(html).toContain("One connected platform for learning, projects and placements");
  expect(html).toContain('aria-label="Public navigation"');
  expect(html).toContain('application/ld+json');
 });
 it("UX-chat16-public-universities-02 provides a campus-specific overview and next step",()=>{
  const html=renderToStaticMarkup(<UniversitiesPage/>);
  expect(universitiesMetadata.title).toBe("Universities | 42 LMS");
  expect(html).toContain("For universities");
  expect(html).toContain("Placement teams");
  expect(html).toContain("Administrators");
  expect(html).toContain('href="/request-demo"');
  expect(html).toContain('aria-label="Campus roles"');
 });
 it("UX-chat16-public-enterprises-03 reaches hiring and learning overviews without login",()=>{
  const html=renderToStaticMarkup(<EnterprisesPage/>);
  expect(enterprisesMetadata.title).toBe("Enterprises | 42 LMS");
  expect(html).toContain("For enterprises");
  expect(html).toContain("Candidate evaluation");
  expect(html).toContain("Hiring operations");
  expect(html).toContain('href="/request-demo"');
  expect(html).toContain('aria-label="Enterprise capabilities"');
 });
 it("UX-chat16-public-demo-04 retains explicit contact and no hidden form submission",()=>{
  const html=renderToStaticMarkup(<RequestDemoPage/>);
  expect(demoMetadata.title).toBe("Request a demo | 42 LMS");
  expect(html).toContain("See 42 LMS in action");
  expect(html).toContain("What to expect");
  expect(html).toContain('href="mailto:hello@42lms.com?subject=42%20LMS%20demo%20request"');
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
