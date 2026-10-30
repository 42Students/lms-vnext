import {describe,it,expect} from "vitest";
import {legacyTpoDrivesListHref,legacyTpoNewDriveHref,
 legacyTpoDriveDetailHref,legacyTpoDriveEditHref}
 from "@/modules/placements/tpo-legacy-drive-route-model";
const job="5b4c5b1b-1a2b-4aa5-810a-1049d3b44f33";
const round="04b17a22-8e21-4a31-ae51-cae228da8b1f";
const root="/tpo/placements/jobs/"+job;

describe("TPO legacy drive bookmarks",()=>{
 it("sends list bookmarks to the canonical list",()=>{
  expect(legacyTpoDrivesListHref()).toBe("/tpo/placements/lifecycle");
 });
 it.each(["requests","drafts","live","closed"])("preserves old list tab %s",tab=>{
  expect(legacyTpoDrivesListHref({tab}))
   .toBe("/tpo/placements/lifecycle?tab="+tab);
 });
 it("preserves keyword and page",()=>{
  const p=new URL(legacyTpoDrivesListHref({tab:"live",q:"Acme & Co",page:"2"}),"https://lms.example");
  expect(p.pathname).toBe("/tpo/placements/lifecycle");
  expect(p.searchParams.get("tab")).toBe("live");
  expect(p.searchParams.get("search")).toBe("Acme & Co");
  expect(p.searchParams.get("page")).toBe("2");
 });
 it("preserves UUID request selection only",()=>{
  expect(legacyTpoDrivesListHref({tab:"requests",request:round}))
   .toContain("request="+round);
  expect(legacyTpoDrivesListHref({request:"unsafe"})).toBe("/tpo/placements/lifecycle");
 });
 it("opens the Requests tab for a direct saved request URL",()=>{
  expect(legacyTpoDrivesListHref({request:round}))
   .toBe("/tpo/placements/lifecycle?tab=requests&request="+round);
  expect(legacyTpoDrivesListHref({tab:"live",request:round}))
   .toBe("/tpo/placements/lifecycle?tab=live");
 });
 it("rejects duplicate, oversized and invalid list parameters",()=>{
  expect(legacyTpoDrivesListHref({tab:["live","closed"],q:["one","two"],page:"-2"}))
   .toBe("/tpo/placements/lifecycle");
  expect(legacyTpoDrivesListHref({q:"x".repeat(101)}))
   .toBe("/tpo/placements/lifecycle");
 });
 it("does not pass obsolete f_* filters through as privileged scopes",()=>{
  expect(legacyTpoDrivesListHref({f_college:"another",f_company:"another"}))
   .toBe("/tpo/placements/lifecycle");
 });
 it("keeps the canonical creator and company prefill",()=>{
  expect(legacyTpoNewDriveHref({company:"Acme & Co"}))
   .toBe("/tpo/placements/new?company=Acme+%26+Co");
 });
 it("keeps repeated company prefills visible to canonical validation",()=>{
  const p=new URL(legacyTpoNewDriveHref({company:["Acme","Other"]}),"https://lms.example");
  expect(p.searchParams.getAll("company")).toEqual(["Acme","Other"]);
 });
 it("truncates oversized company only to invalid-warning length",()=>{
  const p=new URL(legacyTpoNewDriveHref({company:"x".repeat(1000)}),"https://lms.example");
  expect(p.searchParams.get("company")?.length).toBe(151);
 });
 it("ignores attacker-controlled redirect parameters",()=>{
  expect(legacyTpoNewDriveHref({next:"https://evil.example"}))
   .toBe("/tpo/placements/new");
  expect(legacyTpoDriveDetailHref(job,{next:"//evil.example"})).toBe(root);
 });
 it("routes detail bookmarks to the authorized job workspace",()=>{
  expect(legacyTpoDriveDetailHref(job)).toBe(root);
 });
 it.each([
  ["students","applicants"],["applicants","applicants"],
  ["driveday","rounds"],["talk","discussion"],["overview","about"],
  ["offers","offers"],["drive-day","drive-day"],
 ])("maps tab %s to %s", (from,to)=>{
  expect(legacyTpoDriveDetailHref(job,{tab:from})).toBe(root+"?tab="+to);
 });
 it("retains UUID round focus and ignores invalid anchor",()=>{
  expect(legacyTpoDriveDetailHref(job,{tab:"rounds",roundId:round}))
   .toBe(root+"?tab=rounds&roundId="+round);
  expect(legacyTpoDriveDetailHref(job,{tab:"rounds",roundId:"alert(1)"}))
   .toBe(root+"?tab=rounds");
 });
 it("routes not-applied legacy shortcut to its real worklist",()=>{
  expect(legacyTpoDriveDetailHref(job,{show:"not-applied"}))
   .toBe(root+"/not-applied");
  expect(legacyTpoDriveDetailHref(job,{tab:"students",show:"not-applied"}))
   .toBe(root+"/not-applied");
  expect(legacyTpoDriveDetailHref(job,{tab:"offers",show:"not-applied"}))
   .toBe(root+"?tab=offers");
 });
 it("preserves publish handoff but not arbitrary values",()=>{
  expect(legacyTpoDriveDetailHref(job,{publish:"1"})).toBe(root+"?publish=1");
  expect(legacyTpoDriveDetailHref(job,{publish:"0"})).toBe(root);
 });
 it("encodes path separators rather than joining attacker paths",()=>{
  expect(legacyTpoDriveDetailHref("../other?publish=1"))
   .toBe("/tpo/placements/jobs/..%2Fother%3Fpublish%3D1");
 });
 it("keeps existing protected edit route",()=>{
  expect(legacyTpoDriveEditHref(job)).toBe(root+"/edit");
 });
});
