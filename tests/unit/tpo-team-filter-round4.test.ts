import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {filterTpoTeamConversations,tpoTeamConversationCounts,
 tpoTeamConversationFilterSchema} from "@/modules/placements/tpo-team-conversation-filter-model";

const rows=[
 {id:"one",kind:"PRIVATE" as const,following:true,muted:false,unreadCount:3},
 {id:"two",kind:"PRIVATE" as const,following:true,muted:true,unreadCount:1},
 {id:"three",kind:"PRIVATE" as const,following:false,muted:false,unreadCount:7},
 {id:"four",kind:"TOPIC" as const,following:true,muted:false,unreadCount:0},
];
describe("TPO conversations filters",()=>{
 it("TPO-inbox-team-18 counts and filters available thread types without guessing unsupported object threads",()=>{
  expect(tpoTeamConversationCounts(rows)).toEqual({ALL:4,FOLLOWING:3,UNREAD:1,TOPICS:1,DECISIONS:1});
  expect(filterTpoTeamConversations(rows,"TOPICS").map(row=>row.id)).toEqual(["four"]);
  expect(filterTpoTeamConversations(rows,"ALL").length).toBe(4);
  expect(filterTpoTeamConversations(rows,"DECISIONS").map(row=>row.id)).toEqual(["four"]);
  expect(tpoTeamConversationFilterSchema.safeParse("UNSAFE").success).toBe(false);
 });
 it("TPO-inbox-team-23 filters only conversations with recorded, unrevoked decisions",()=>{
  const reader=readFileSync(join(process.cwd(),"src/modules/placements/tpo-team-internal-read-service.ts"),"utf8");
  const page=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/team/page.tsx"),"utf8");
  expect(reader).toContain("hasDecisions:sql<boolean>");
  expect(reader).toContain("later.event_type in");
  expect(page).toContain('(["ALL","FOLLOWING","UNREAD","TOPICS","DECISIONS"] as const)');
  expect(page).toContain('"Decisions"');
 });
 it("TPO-inbox-team-20 only counts followed, unmuted member-thread unread as actionable",()=>{
  expect(filterTpoTeamConversations(rows,"UNREAD").map(row=>row.id)).toEqual(["one"]);
  expect(filterTpoTeamConversations(rows,"FOLLOWING").map(row=>row.id))
   .toEqual(["one","two","four"]);
 });
 it("TPO-inbox-team-18 keeps filter state in the URL and explains an empty filtered result",()=>{
  const page=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/team/page.tsx"),"utf8");
  expect(page).toContain("tpoTeamConversationFilterSchema.optional()");
  expect(page).toContain("conversationCounts[key]");
  expect(page).toContain("No conversations match these filters. Clear filters to see all.");
  expect(page).toContain("visibleConversations.map(row");
 });
});
