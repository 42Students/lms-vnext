import {describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {MentorProjectTabs} from "@/components/projects/mentor-project-tabs";

const state=vi.hoisted(()=>({query:""}));
vi.mock("next/navigation",()=>({
 useSearchParams:()=>new URLSearchParams(state.query),
}));
const projectId="11111111-1111-4111-8111-111111111111";
const draw=()=>renderToStaticMarkup(<MentorProjectTabs projectId={projectId}/>);

describe("PROJ-BREAK-mentor-page-01 rendered project workspace navigation",()=>{
 it("PROJ-BREAK-mentor-page-01 exposes all seven prototype tabs with readable headings and one current page",()=>{
  state.query="tab=overview";
  const html=draw();
  expect(html).toContain('aria-label="Project sections"');
  expect(html).toContain('data-axis="x"');
  for(const title of ["Overview","Board","Sprints &amp; releases","Team &amp; meetings","Performance","Resources","Activity"])
   expect(html).toContain(title);
  expect((html.match(/href="\/mentor\/projects\//g)??[])).toHaveLength(7);
  expect((html.match(/aria-current="page"/g)??[])).toHaveLength(1);
  expect(html).toContain('href="/mentor/projects/'+projectId+'?tab=overview"');
 });
 it("PROJ-BREAK-mentor-page-02 restores legacy deep links without allowing fabricated tabs",()=>{
  for(const [query,expected] of [
   ["tab=tasks","?tab=board"],
   ["tab=meetings","?tab=team"],
   ["tab=unknown","?tab=overview"],
   ["tab=__proto__","?tab=overview"],
   ["","?tab=overview"],
  ]){
    state.query=query;
    const html=draw();
    const active=html.match(/<a[^>]+aria-current="page"[^>]*>/g)??[];
    expect(active,query).toHaveLength(1);
    expect(active[0],query).toContain(expected);
  }
 });
 it("PROJ-BREAK-mentor-page-03 safely URL-encodes IDs and preserves keyboard focus indicators",()=>{
  state.query="tab=resources";
  const html=renderToStaticMarkup(<MentorProjectTabs projectId="another/project?tab=admin"/>);
  expect(html).toContain("another%2Fproject%3Ftab%3Dadmin");
  expect(html).not.toContain('href="/mentor/projects/another/project');
  expect(html).toContain("focus-visible:outline-2");
  expect(html).toContain('aria-current="page"');
 });
});
