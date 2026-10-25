import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {
 tpoPrototypeSectionForPath,tpoPrototypeSidebarActive,tpoPrototypeTabActive,
 TPO_PROTOTYPE_NAV,TPO_PROTOTYPE_SECTIONS,
} from "@/components/shell/tpo-prototype-navigation";

const active=(pathname:string,href:string,search="")=>
 tpoPrototypeTabActive(pathname,new URLSearchParams(search),href);

describe("2026 TPO screenshot navigation parity",()=>{
 it("keeps the prototype eight top-level sections in exact order",()=>{
  expect(TPO_PROTOTYPE_NAV.map(item=>item.label)).toEqual([
   "Home","Students","Drives","Companies","Calendar","Team","Reports","Settings",
  ]);
  expect(TPO_PROTOTYPE_SECTIONS.Companies.map(item=>item.label)).toEqual([
   "Today","Recruiters","Companies","Emails","Messages",
  ]);
  expect(TPO_PROTOTYPE_SECTIONS.Students.map(item=>item.label)).toEqual([
   "All students","Who's in placements","To verify","Requests","Announcements",
  ]);
 });
 it("activates Messages by default without highlighting Team Chat",()=>{
  expect(active("/tpo/messages","/tpo/messages?tab=recruiters")).toBe(true);
  expect(active("/tpo/messages","/tpo/messages?tab=team")).toBe(false);
  expect(active("/tpo/messages","/tpo/messages?tab=team","tab=team")).toBe(true);
  expect(active("/tpo/messages","/tpo/messages?tab=recruiters","tab=team")).toBe(false);
  expect(tpoPrototypeSectionForPath("/tpo/messages","team")).toBe("Team");
 });
 it("keeps Company and Recruiter details in their prototype tabs",()=>{
  expect(active("/tpo/companies/today","/tpo/companies/today")).toBe(true);
  expect(active("/tpo/companies/today","/tpo/companies?directory=1")).toBe(false);
  expect(active("/tpo/companies/archived","/tpo/companies?directory=1")).toBe(true);
  expect(active("/tpo/companies/123","/tpo/companies?directory=1")).toBe(true);
  expect(active("/tpo/companies","/tpo/companies?directory=1","name=Infosys")).toBe(true);
  expect(active("/tpo/recruiters/123","/tpo/recruiters")).toBe(true);
  expect(active("/tpo/recruiters/campaigns/new","/tpo/recruiters")).toBe(false);
  expect(active("/tpo/recruiters/campaigns/new","/tpo/recruiters/campaigns")).toBe(true);
  expect(active("/tpo/follow-ups","/tpo/companies/today")).toBe(true);
 });
 it("keeps nested placement, student, report and settings routes highlighted",()=>{
  expect(active("/tpo/placements/jobs/1/offers","/tpo/placements")).toBe(true);
  expect(active("/tpo/drive-day/1","/tpo/drive-day")).toBe(true);
  expect(active("/tpo/batches/1","/tpo/batches")).toBe(true);
  expect(active("/tpo/verification","/tpo/verification")).toBe(true);
  expect(active("/tpo/reports/by-branch","/tpo/reports")).toBe(true);
  expect(active("/tpo/audit/actors","/tpo/audit")).toBe(true);
  expect(active("/tpo/settings/rules","/tpo/settings")).toBe(true);
  expect(active("/tpo/settings/team","/tpo/settings")).toBe(false);
  expect(active("/tpo/settings/team","/tpo/settings/team")).toBe(true);
  expect(tpoPrototypeSidebarActive("/tpo/settings/team",{label:"Team",href:"/tpo/team"})).toBe(true);
 });
 it("renders real-data action queue, week calendar and rates without placeholder totals",()=>{
  const source=readFileSync(join(process.cwd(),"src/components/tpo/tpo-home-prototype-focus.tsx"),"utf8");
  const home=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/home/page.tsx"),"utf8");
  expect(home).toContain("<TpoHomePrototypeFocus needs={homeNeeds}");
  expect(source).toContain('data-testid="tpo.home.prototype-focus"');
  expect(source).toContain('aria-label="Things that need you"');
  expect(source).toContain('aria-label="Upcoming placement schedule"');
  expect(source).toContain('aria-label="Placement overview"');
  expect(source).toContain("ranked.slice(0,6)");
  expect(source).toContain("calendarAvailable");
  expect(source).toContain('placed??"—"');
  expect(source).toContain('pool??"—"');
  expect(source).toContain("pool>0");
  expect(home).toContain("Other placement tools and indicators");
 });
});
