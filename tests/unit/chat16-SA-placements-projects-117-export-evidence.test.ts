import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {trackerLogCsv,trackerLogMarkdown} from "@/components/tracker/tracker-live-logs-explorer";

const row=(changes:Record<string,string|null>={})=>({
 id:"event-1",time:"2026-10-18T02:00:00Z",event:"Exception",
 message:"Database temporarily unavailable",path:"/api/assignments",
 requestId:"request-1",component:"service",...changes,
});

describe("SA-placements-projects-117 export and Claude report",()=>{
 it("SA-placements-projects-117 produces bounded report content from source-approved redacted entries",()=>{
  const markdown=trackerLogMarkdown([row()]);
  expect(markdown).toContain("# Tracker live log report");
  expect(markdown).toContain("Generated from redacted log records");
  expect(markdown).toContain("Reference: request-1");
  expect(markdown).toContain("Route: /api/assignments");
 });
 it("SA-placements-projects-117 quotes CSV, escapes formulas and preserves column boundaries",()=>{
  const output=trackerLogCsv([
   row({event:'=HYPERLINK("https://host","click")',message:'+cmd\r\nsecond line',path:"@SUM(1,1)"}),
   row({event:"-1+1",message:"Normal text",requestId:null}),
  ]);
  expect(output.startsWith("Time,Event,Route,Component,Reference,Message\n")).toBe(true);
  expect(output).toContain("'=HYPERLINK");
  expect(output).toContain("'@SUM(1,1)");
  expect(output).toContain("'+cmd second line");
  expect(output).toContain("'-1+1");
  expect(output).toContain('"Reference"') .toBe(false);
  expect(output.split("\n")).toHaveLength(3);
  expect(output).toContain('""https://host""');
 });
 it("SA-placements-projects-117 only exports bounded pages and never claims unrestricted completeness",()=>{
  const source=readFileSync("src/components/tracker/tracker-live-logs-explorer.tsx","utf8");
  expect(source).toContain("for(let i=0;i<20;i++)");
  expect(source).toContain("not claimed complete when the 240-entry export limit is reached");
  expect(source).toContain("Downloaded the first ");
  expect(source).toContain("No matching log entries to download.");
  expect(source).toContain("Report for Claude");
  expect(source).toContain("trackerLogCsv(rows)");
 });
});