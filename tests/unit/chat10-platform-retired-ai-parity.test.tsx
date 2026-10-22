import {describe,expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import PlatformMarketingPage from "@/app/platform/page";

describe("W1-1 approved non-AI platform copy crosswalk",()=>{
 it("preserves the six-section legacy layout with seven role workspaces and four current product pillars",()=>{
  const html=renderToStaticMarkup(<PlatformMarketingPage/>);
  const first=html.indexOf("The platform");
  const agents=html.indexOf("Every role has a purpose-built workspace");
  const pillars=html.indexOf("Everything you need to develop talent");
  const integrations=html.indexOf("Workflows connected across learning and hiring");
  const lifecycle=html.indexOf("A complete talent lifecycle");
  const cta=html.indexOf("Explore the platform with our team");
  expect(first).toBeGreaterThanOrEqual(0);
  expect(agents).toBeGreaterThan(first);
  expect(pillars).toBeGreaterThan(agents);
  expect(integrations).toBeGreaterThan(pillars);
  expect(lifecycle).toBeGreaterThan(integrations);
  expect(cta).toBeGreaterThan(lifecycle);
  for(const role of ["Learner workspace","Faculty workspace","Mentor workspace",
   "Career and placement workspace","Course and content administration",
   "Placement operations","Project and team management"]){
    expect(html).toContain(role);
  }
  for(const pillar of ["Learning","Projects","Placements","Operations"]){
    expect(html).toContain(pillar);
  }
  expect(html).toContain("Integrations");
  expect(html).not.toContain("One autonomous AI platform");
  expect(html).not.toContain("Specialized AI agents");
 });
});
