import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {
 splitTpoTodayFollowups,tpoTodayFocusHref,rankTpoCompaniesToday,
 tpoTodayAgendaDay,tpoTodayAgendaHref,
 type TpoCompaniesTodayRow,
} from "@/modules/placements/tpo-companies-today-model";

const row=(id:string,dueAt:string):TpoCompaniesTodayRow=>({
 id,leadId:id,leadName:id,companyName:"Company",
 dueAt,note:null,phoneNorm:null,canContact:false,overdue:false,
});

describe("TPO prototype Companies Today agenda and brief",()=>{
 it("groups overdue and same-day follow-ups by IST, not UTC",()=>{
  const now=new Date("2026-10-25T20:00:00Z"); // 26 Oct, 01:30 IST
  const tasks=[
   row("overdue","2026-10-24T09:00:00Z"),
   row("today","2026-10-25T20:30:00Z"),
   row("tomorrow","2026-10-26T18:45:00Z"),
  ];
  const result=splitTpoTodayFollowups(tasks,now);
  expect(result.due.map(item=>item.id)).toEqual(["overdue","today"]);
  expect(result.upcoming.map(item=>item.id)).toEqual(["tomorrow"]);
  expect(result.due.length+result.upcoming.length).toBe(tasks.length);
 });
 it("preserves source-backed task facts when sorting and grouping",()=>{
  const tasks=rankTpoCompaniesToday([
   row("late","2026-10-26T18:45:00Z"),
   row("early","2026-10-25T19:00:00Z"),
  ],[row("late","2026-10-26T18:45:00Z")]);
  expect(splitTpoTodayFollowups(tasks,new Date("2026-10-25T20:00:00Z"))
   .due.map(item=>item.id)).toEqual(["early"]);
  expect(tasks).toHaveLength(2);
 });
 it("deep-links the exact task and preserves Everyone scope without adding a tenant selector",()=>{
  const task="104d723a-5b5b-4a0b-8337-4429c24cb661";
  expect(tpoTodayFocusHref("MINE",task)).toBe("/tpo/companies/today?lead="+task);
  expect(tpoTodayFocusHref("TEAM",task)).toBe("/tpo/companies/today?scope=TEAM&lead="+task);
  expect(tpoTodayFocusHref("TEAM")).toBe("/tpo/companies/today?scope=TEAM");
 });
 it("accepts only single, bounded seven-day selections and keeps Everyone scoped",()=>{
  expect(tpoTodayAgendaDay(undefined)).toBe(0);
  for(let i=0;i<=6;i++){
   expect(tpoTodayAgendaDay(String(i))).toBe(i);
   expect(tpoTodayAgendaHref("MINE",i)).toBe("/tpo/companies/today?view=agenda"+(i?"&day="+i:""));
  }
  expect(tpoTodayAgendaHref("TEAM",2)).toBe("/tpo/companies/today?scope=TEAM&view=agenda&day=2");
  for(const value of ["7","-1","01","","2.5",["1","2"],null]){
   expect(tpoTodayAgendaDay(value)).toBeNull();
  }
 });
 it("routes both screenshot variants to real data and the existing persisted action workflow",()=>{
  const page=readFileSync("src/app/(authenticated)/tpo/companies/today/page.tsx","utf8");
  const views=readFileSync("src/components/tpo/tpo-today-alternate-views.tsx","utf8");
  const focus=readFileSync("src/components/tpo/tpo-companies-today.tsx","utf8");
  expect(page).toContain('view==="agenda"||view==="brief"');
  expect(page).toContain("getTpoDueFollowupQueue");
  expect(page).toContain("getTpoMessagesInbox");
  expect(page).toContain("initialFollowupId=");
  expect(views).toContain('view==="agenda"');
  expect(views).toContain('view==="brief"');
  expect(views).toContain("splitTpoTodayFollowups");
  expect(views).toContain("tpoTodayFocusHref(scope,row.id)");
  expect(views).toContain("tpoTodayAgendaHref(scope,index)");
  expect(views).toContain("agendaRows");
  expect(page).toContain("tpoTodayAgendaDay(params.day)");
  expect(focus).toContain("rows.some(row=>row.id===initialFollowupId)");
 });
 it("keeps unassigned CRM follow-ups visible in My Work without dropping the college boundary",()=>{
  const source=readFileSync("src/modules/placements/tpo-followup-queue-service.ts","utf8");
  expect(source).toContain("eq(placementTpoFollowups.collegeId,collegeId)");
  expect(source).toContain("eq(placementTpoLeads.collegeId,collegeId)");
  expect(source).toContain('...(query.scope==="MINE"?[or(');
  expect(source).toContain("eq(placementTpoFollowups.ownerMembershipId,ownerMembershipId)");
  expect(source).toContain("isNull(placementTpoFollowups.ownerMembershipId)");
 });
});
