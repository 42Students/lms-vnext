import {describe,expect,it} from "vitest";
import {buildTpoLegacyHomeRows,type TpoHomeSummary} from "@/modules/placements/tpo-home-legacy-rows";
const empty:TpoHomeSummary={batch:null,moreBatches:0,liveDrives:0,driveAttention:0,
 registered:null,placedUnique:null,recruiterLeads:null,followUps:null,recruiterAccess:null,
 pendingRequests:0,messages:null,teamAsks:null,teamMentions:null,teamUnread:null,upcoming:[]};
describe("TPO-home-03 legacy seven-row contract",()=>{
 it("preserves dev branch titles, order, each working destination and empty text",()=>{
  const rows=buildTpoLegacyHomeRows(empty);
  expect(rows.map(r=>r.title)).toEqual(["Placement eligibility","Drives","Students","Engage","Inbox","Team","This week"]);
  expect(rows.map(r=>r.href)).toEqual(["/tpo/batches","/tpo/placements","/tpo/students",
   "/tpo/recruiters","/tpo/messages","/tpo/team","/tpo/calendar"]);
  expect(rows[0].status).toBe("No batch in placements yet");
  expect(rows[1].status).toBe("No live drives");
  expect(rows[6].status).toBe("Nothing on the calendar");
 });
 it("uses authoritative inputs only, without pretending unknown counts are zero",()=>{
  const rows=buildTpoLegacyHomeRows({...empty,
   batch:{name:"2026",invited:false,eligible:80,registered:35,placed:null},
   liveDrives:3,pendingRequests:2});
  expect(rows[0].status).toContain("35 of 80 registered");
  expect(rows[0].needsAttention).toBe(true);
  expect(rows[1].status).toContain("3 live");
  expect(rows[4].status).toBe("2 requests · Messages unavailable");
  expect(rows[4].href).toBe("/tpo/requests");
 });
});
