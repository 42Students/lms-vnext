import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {placementReportCsv} from "@/modules/placements/report-model";

const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

describe("chat-7 final sprint: TPO calendar and reports",()=>{
 it("TPO-calendar-reports-45 shows actual issued-offer states without inventing selection evidence",()=>{
  const page=read("src/app/(authenticated)/tpo/reports/placement-summary/page.tsx");
  const model=read("src/modules/placements/report-model.ts");
  expect(page).toContain('aria-label="Offers by current status"');
  for(const status of ["Released (all issued histories)","Waiting for student","Accepted",
   "Declined","Withdrawn","Expired waiting"])expect(page).toContain(status);
  expect(page).toContain("Selections under verification and reversed selections are separate lifecycle data");
  expect(model).toContain("Historical status transitions are not inferred from current status.");
  expect(model).toContain("expiredOutstanding");
 });
 it("TPO-calendar-reports-52 escapes report-specific CSV, writes CRLF and starts downloads with BOM",()=>{
  const csv=placementReportCsv(["Student","CTC"],[["=HYPERLINK(\"bad\")",800000],["A, B",null]]);
  expect(csv).toContain("'=HYPERLINK");
  expect(csv).toContain("\r\n");
  expect(csv.startsWith('"Student","CTC"')).toBe(true);
  const route=read("src/app/api/placements/reports/route.ts");
  expect(route).toContain('new Response(`﻿${csv}`,');
  for(const kind of ["placement-summary","by-branch","by-company","failure-reasons",
   "leads","ctc","unplaced","offers-acceptance","joining-status"]){
   expect(route).toContain('case "'+kind+'"');
  }
  expect(route).toContain('"Content-Disposition"');
 });
 it("TPO-calendar-reports-R07 renders calendar from scheduled bounded event data without full leads directory scans",()=>{
  const calendar=read("src/app/(authenticated)/tpo/calendar/page.tsx");
  const workspace=read("src/components/placements/placement-calendar-workspace.tsx");
  expect(calendar).toContain("<PlacementCalendarWorkspace");
  expect(calendar).toContain("parseTpoCalendarUrl");
  expect(calendar).not.toContain("listTpoLeads(");
  expect(workspace).not.toContain("listTpoLeads(");
  expect(workspace).not.toContain(".slice(0,100)");
  expect(workspace).toContain("event.leadId");
 });
});
