import {readFileSync} from "node:fs";
import {describe,expect,it,vi} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {TpoCompaniesToday} from "@/components/tpo/tpo-companies-today";
import {TpoTodayAlternateViews} from "@/components/tpo/tpo-today-alternate-views";

vi.mock("next/navigation",()=>({useRouter:()=>({refresh:()=>{}})}));
import {
 splitTpoTodayFollowups,tpoTodayFocusHref,rankTpoCompaniesToday,
 tpoTodayAgendaDay,tpoTodayAgendaHref,
 summarizeTpoTodayNotContacted,summarizeTpoTodayOutsideWeek,tpoTodayLateDays,
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
 it("counts only true NEW recruiters in the college-scoped selected ownership view",()=>{
  const leads=[
   {stage:"NEW",ownerMembershipId:null,createdAt:new Date("2026-10-20T10:00:00Z")},
   {stage:"NEW",ownerMembershipId:"self",createdAt:new Date("2026-10-22T10:00:00Z")},
   {stage:"NEW",ownerMembershipId:"other",createdAt:new Date("2026-10-19T10:00:00Z")},
   {stage:"CONTACTED",ownerMembershipId:"self",createdAt:new Date("2026-10-18T10:00:00Z")},
   {stage:"INVITED",ownerMembershipId:null,createdAt:new Date("2026-10-17T10:00:00Z")},
  ];
  expect(summarizeTpoTodayNotContacted(leads,"MINE","self")).toEqual({
   count:2,oldestAddedAt:"2026-10-20T10:00:00.000Z",
  });
  expect(summarizeTpoTodayNotContacted(leads,"TEAM","self")).toEqual({
   count:3,oldestAddedAt:"2026-10-19T10:00:00.000Z",
  });
  expect(summarizeTpoTodayNotContacted([],"MINE","self")).toEqual({
   count:0,oldestAddedAt:null,
  });
 });
 it("routes both screenshot variants to real data and the existing persisted action workflow",()=>{
  const page=readFileSync("src/app/(authenticated)/tpo/companies/today/page.tsx","utf8");
  const views=readFileSync("src/components/tpo/tpo-today-alternate-views.tsx","utf8");
  const focus=readFileSync("src/components/tpo/tpo-companies-today.tsx","utf8");
  expect(page).toContain('view==="agenda"||view==="brief"');
  expect(page).toContain("getTpoDueFollowupQueue");
  expect(page).toContain("getTpoMessagesInbox");
  expect(page).toContain("listTpoLeads");
  expect(views).toContain("notContacted.count");
  expect(views).toContain("href=\"/tpo/recruiters?stage=NEW\"");
  expect(page).toContain("initialFollowupId=");
  expect(page).toContain('!rows.some(row=>row.id===params.lead)');
  expect(page).toContain("No other recruiter was selected.");
  expect(page).toContain('(params.lead!==undefined&&view!=="focus")');
  expect(views).toContain('view==="agenda"');
  expect(views).toContain('view==="brief"');
  expect(views).toContain("splitTpoTodayFollowups");
  expect(views).toContain("tpoTodayFocusHref(scope,row.id)");
  expect(views).toContain("tpoTodayAgendaHref(scope,index)");
  expect(views).toContain("agendaRows");
  expect(page).toContain("tpoTodayAgendaDay(params.day)");
  expect(focus).toContain("rows.some(row=>row.id===initialFollowupId)");
  expect(focus).toContain("notContacted.count");
  expect(focus).toContain('href="/tpo/recruiters?stage=NEW"');
 });
 it("renders real CRM context without fabricating company trust or a sent email",()=>{
  const html=renderToStaticMarkup(createElement(TpoCompaniesToday,{
   scope:"MINE",
   nowIso:"2026-10-26T08:00:00+05:30",
   rows:[{id:"11111111-1111-4111-8111-111111111111",
    leadId:"22222222-2222-4222-8222-222222222222",
    leadName:"Asha Rao",companyName:"Example Employer",
    dueAt:"2026-10-25T08:00:00+05:30",note:"Discuss campus recruitment",
    phoneNorm:null,canContact:true,overdue:true}],
   hasMore:false,unreadMessages:0,replyTotal:1,
   initialFollowupId:"11111111-1111-4111-8111-111111111111",
   companyAttention:{items:[{relationshipId:"44444444-4444-4444-8444-444444444444",
    companyId:"55555555-5555-4555-8555-555555555555",companyName:"Unverified Employer",
    collegeTrusted:false,recruiterId:"66666666-6666-4666-8666-666666666666",
    recruiterName:"Joined Recruiter"}],hasMore:false},
   replies:[{id:"33333333-3333-4333-8333-333333333333",
    name:"Ravi Recruiter",company:"Example Employer",subject:"Campus hiring",
    preview:"Interested in a visit",receivedAt:"2026-10-26T01:00:00Z",accessEnded:false}],
   notContacted:{count:1,oldestAddedAt:"2026-10-20T00:00:00Z"},
   leadContexts:[{id:"22222222-2222-4222-8222-222222222222",
    designation:"HR Lead",stage:"JOINED",emailNorm:"asha@example.org",ownerName:"Placement Team"}],
  }));
  expect(html).toContain("Asha Rao");
  expect(html).toContain("Discuss campus recruitment");
  expect(html).toContain("Campus hiring");
  expect(html).toContain("mailto:asha@example.org");
  expect(html).toContain("Later &amp; next");
  expect(html).toContain("Record outcome and plan next follow-up");
  expect(html).toContain("3 things need you");
  expect(html).toContain("Unverified Employer");
  expect(html).toContain("Company not verified");
  expect(html).toContain("Review company trust and verification");
  expect(html).toContain("Review company trust on its record");
  expect(html).not.toContain("Verify Example Employer");
  expect(html).not.toContain("Email sent");
 });
 it("selects a real company-identity task first and keeps college trust distinct from platform verification",()=>{
  const html=renderToStaticMarkup(createElement(TpoCompaniesToday,{
   scope:"MINE",nowIso:"2026-10-26T08:00:00Z",hasMore:false,
   rows:[{...row("followup","2026-10-26T03:00:00Z"),leadName:"Follow-up person"}],
   companyAttention:{items:[{relationshipId:"relationship-id",companyId:"company-id",
    companyName:"Employer Example",collegeTrusted:true,recruiterId:"lead-id",recruiterName:"Recruiter Example"}],
    hasMore:false},
   replies:[{id:"reply-id",name:"Second recruiter",company:"Another employer",
    subject:"Can we talk?",preview:"Hello",receivedAt:"2026-10-26T04:00:00Z",accessEnded:false}],
   replyTotal:1,notContacted:{count:0,oldestAddedAt:null},leadContexts:[],unreadMessages:0,
  }));
  expect(html).toContain("3 things need you");
  expect(html).toContain("tpo.today.company-detail");
  expect(html).toContain('aria-selected="true"');
  expect(html).toContain("Recruiter Example");
  expect(html).toContain("Company identity".toUpperCase());
  expect(html).toContain("Not verified by 42");
  expect(html).toContain("College trust: Trusted");
  expect(html).toContain('href="/tpo/companies/company-id"');
  expect(html).toContain('href="/tpo/recruiters/lead-id"');
  expect(html).toContain("Later &amp; next changes selection only");
  expect(html).not.toContain("Verified Employer Example");
  expect(html).not.toContain("Email sent");
 });
 it("lets a waiting recruiter reply become the selected item without sending email",()=>{
  const html=renderToStaticMarkup(createElement(TpoCompaniesToday,{
   scope:"TEAM",nowIso:"2026-10-26T08:00:00Z",hasMore:false,
   rows:[],companyAttention:{items:[],hasMore:false},
   replies:[{id:"reply-id",name:"Recruiter One",company:"Employer",
    subject:"Interview slots?",preview:"Please confirm a slot",
    receivedAt:"2026-10-26T04:00:00Z",accessEnded:false}],
   replyTotal:1,notContacted:{count:0,oldestAddedAt:null},leadContexts:[],unreadMessages:0,
  }));
  expect(html).toContain("tpo.today.reply-detail");
  expect(html).toContain("Please confirm a slot");
  expect(html).toContain('href="/tpo/messages?tab=recruiters&amp;thread=reply-id"');
  expect(html).toContain("Answer in Messages");
  expect(html).toContain("Merely selecting this item never sends email");
  expect(html).not.toContain("Email sent");
 });
 it("exposes incomplete queue and recruiter inbox as warnings, not false zero totals",()=>{
  const html=renderToStaticMarkup(createElement(TpoCompaniesToday,{
   scope:"TEAM",rows:[],nowIso:"2026-10-26T08:00:00+05:30",
   hasMore:true,unreadMessages:null,replyTotal:null,replies:[],notContacted:null,leadContexts:[],companyAttention:null,
  }));
  expect(html).toContain("focus preview");
  expect(html).toContain("temporarily unavailable");
  expect(html).toContain("Not-contacted recruiter count unavailable");
  expect(html).toContain("Company verification attention is unavailable");
  expect(html).not.toContain("No recruiters in this college");
 });
 it("keeps platform verification separate from college trust and only exposes read-only review links",()=>{
  const service=readFileSync("src/modules/placements/tpo-today-company-attention-service.ts","utf8");
  const today=readFileSync("src/components/tpo/tpo-companies-today.tsx","utf8");
  expect(service).toContain('isNull(placementCompanies.verifiedAt)');
  expect(service).toContain('eq(placementCompanyRelationships.collegeId,collegeId)');
  expect(service).toContain('eq(placementTpoLeads.collegeId,collegeId)');
  expect(service).toContain('isNotNull(placementTpoLeads.recruiterUserId)');
  expect(service).toContain('hasMembershipRole(context,"TPO")');
  expect(service).toContain('scope==="MINE"?[or(');
  expect(today).toContain("College trust:");
  expect(today).toContain("Not verified by 42");
  expect(today).toContain('role="listbox"');
  expect(today).toContain('data-testid="tpo.today.company-detail"');
  expect(today).toContain("focusItems.map(item=>");
  expect(today).not.toContain("Verify company now");
 });
 it("keeps unassigned CRM follow-ups visible in My Work without dropping the college boundary",()=>{
  const source=readFileSync("src/modules/placements/tpo-followup-queue-service.ts","utf8");
  expect(source).toContain("eq(placementTpoFollowups.collegeId,collegeId)");
  expect(source).toContain("eq(placementTpoLeads.collegeId,collegeId)");
  expect(source).toContain('...(query.scope==="MINE"?[or(');
  expect(source).toContain("eq(placementTpoFollowups.ownerMembershipId,ownerMembershipId)");
  expect(source).toContain("isNull(placementTpoFollowups.ownerMembershipId)");
 });
 it("counts out-of-week work only for active, authorized CRM leads",()=>{
  const now=new Date("2026-10-26T03:00:00Z");
  const leads=[
   {stage:"NEW",ownerMembershipId:null,nextFollowupAt:null,unsubscribedAt:null},
   {stage:"CONTACTED",ownerMembershipId:"self",nextFollowupAt:"2026-11-02T06:00:00Z",unsubscribedAt:null},
   {stage:"INVITED",ownerMembershipId:"self",nextFollowupAt:"2026-11-01T03:00:00Z",unsubscribedAt:null},
   {stage:"RECRUITED",ownerMembershipId:"self",nextFollowupAt:null,unsubscribedAt:null},
   {stage:"NOT_NOW",ownerMembershipId:"self",nextFollowupAt:null,unsubscribedAt:null},
   {stage:"NEW",ownerMembershipId:"other",nextFollowupAt:null,unsubscribedAt:null},
   {stage:"NEW",ownerMembershipId:"self",nextFollowupAt:null,unsubscribedAt:"2026-10-25T00:00:00Z"},
  ];
  expect(summarizeTpoTodayOutsideWeek(leads,"MINE","self",now))
   .toEqual({withoutDate:1,laterThanWeek:1});
  expect(summarizeTpoTodayOutsideWeek(leads,"TEAM","self",now))
   .toEqual({withoutDate:2,laterThanWeek:1});
 });
 it("does not call a same-day follow-up late because its clock time has passed",()=>{
  const now=new Date("2026-10-26T08:00:00Z");
  expect(tpoTodayLateDays("2026-10-26T01:00:00Z",now)).toBe(0);
  expect(tpoTodayLateDays("2026-10-25T18:00:00Z",now)).toBe(1);
  expect(tpoTodayLateDays("2026-10-22T14:00:00Z",now)).toBe(4);
  expect(tpoTodayLateDays("bad date",now)).toBe(0);
 });
 it("renders Agenda and Brief with original three-task structure and real follow-up states",()=>{
  const props={
   scope:"MINE" as const,nowIso:"2026-10-26T08:00:00Z",
   selectedDay:0,hasMore:false,replyTotal:1,
   rows:[row("task-1","2026-10-25T18:00:00Z")],
   replies:[{id:"message-1",name:"Recruiter B",company:"Example Co",
    subject:"Interview query",preview:"Can we confirm Tuesday?",
    receivedAt:"2026-10-26T06:00:00Z",accessEnded:false}],
   notContacted:{count:2,oldestAddedAt:"2026-10-21T06:00:00Z"},
   outsideWeek:{withoutDate:4,laterThanWeek:1},
  };
  const agenda=renderToStaticMarkup(createElement(TpoTodayAlternateViews,{...props,view:"agenda"}));
  expect(agenda).toContain("Today: 1 to answer, 1 to reach");
  expect(agenda).toContain("Not contacted yet");
  expect(agenda).toContain("Not on the week");
  expect(agenda).toContain("4 with no date");
  expect(agenda).toContain("1 later than the next seven days");
  expect(agenda).toContain("1 day late");
  expect(agenda).toContain('href="/tpo/recruiters?nextFollowup=NONE"');
  expect(agenda).toContain('href="/tpo/recruiters?stage=NEW"');
  const brief=renderToStaticMarkup(createElement(TpoTodayAlternateViews,{...props,view:"brief"}));
  expect(brief).toContain("2 things need you today");
  expect(brief).toContain("Answer");
  expect(brief).toContain("Reach");
  expect(brief).toContain("This week");
  expect(brief).toContain("4 with no date");
 });
 it("signals unavailable totals rather than claiming zero when optional roster data fails",()=>{
  const html=renderToStaticMarkup(createElement(TpoTodayAlternateViews,{
   view:"agenda",scope:"TEAM",selectedDay:0,nowIso:"2026-10-26T08:00:00Z",
   hasMore:true,rows:[],replies:[],replyTotal:null,outsideWeek:null,notContacted:null,
  }));
  expect(html).toContain("Counts unavailable");
  expect(html).toContain("Recruiter replies are temporarily unavailable");
  expect(html).toContain("limited preview");
 });

 it("does not change the selected queue item during a pending mutation, and advances only after confirmation",()=>{
  const source=readFileSync("src/components/tpo/tpo-companies-today.tsx","utf8");
  expect(source).toContain("if(pending||inFlight.current)return");
  expect(source).toContain('if(!pending&&(e.key==="j"||e.key==="k"))');
  expect(source).toContain('const nextItem=focusItems[at+1]??focusItems[at-1]??null;');
  expect(source.indexOf('setSelectedKey(nextItem?.key??null)')).toBeGreaterThan(
   source.indexOf('if(kind==="TOMORROW"&&!payload?.followup?.dueAt)'));
  expect(source).toContain('expectedDueAt:current.dueAt');
  expect(source).toContain('inFlight.current=true;setPending(true)');
 });
 it("hides outbound contact links when the persisted CRM lead is not contactable",()=>{
  const html=renderToStaticMarkup(createElement(TpoCompaniesToday,{
   scope:"MINE",nowIso:"2026-10-26T10:00:00Z",hasMore:false,
   rows:[{...row("task-1","2026-10-26T03:00:00Z"),leadId:"lead-1",
    leadName:"Unsubscribed Contact",canContact:false,phoneNorm:"9876543210"}],
   leadContexts:[{id:"lead-1",emailNorm:"former@example.org",
    stage:"CONTACTED",designation:"Recruiter",ownerName:null}],
   replyTotal:0,replies:[],companyAttention:{items:[],hasMore:false},
   unreadMessages:0,notContacted:{count:0,oldestAddedAt:null},
  }));
  expect(html).toContain("Unsubscribed Contact");
  expect(html).not.toContain("mailto:former@example.org");
  expect(html).not.toContain("tel:");
  expect(html).toContain("Further outreach");
 });

});
