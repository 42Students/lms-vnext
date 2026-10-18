import {describe,expect,it} from "vitest";
import {summarizeRecruiterUnread} from "@/modules/placements/hr-conversation-unread-model";
import {hrConversationPageBounds,orderRecruiterConversations,
 onlyUnreadRecruiterThreads,scopeRecruiterConversations,recruiterMessageSearchLimit}
 from "@/modules/placements/hr-conversation-inbox-model";

describe("HR-MESSAGING-DEPTH-72: unread counters and large inbox boundaries",()=>{
 it("ignores malformed, negative, fractional and nonfinite unread counters",()=>{
  expect(summarizeRecruiterUnread([{unread:3},{unread:-2},{unread:Number.NaN},
   {unread:Number.POSITIVE_INFINITY},{unread:0.5},{unread:2}])).toBe(5);
 });
 it("saturates at the safe integer limit rather than overflowing",()=>{
  expect(summarizeRecruiterUnread([{unread:Number.MAX_SAFE_INTEGER},{unread:10}]))
   .toBe(Number.MAX_SAFE_INTEGER);
 });
 it("a stale inbox page is clamped to the last available authorized page",()=>{
  expect(hrConversationPageBounds(9999,21)).toEqual({page:2,pages:2,first:21,last:21});
  expect(hrConversationPageBounds(0,0)).toEqual({page:1,pages:1,first:0,last:0});
  expect(hrConversationPageBounds(Number.NaN,1).page).toBe(1);
 });
 it("general and drive threads split exactly; unread-only never borrows a foreign thread ID",()=>{
  const rows=[{id:"general",jobId:null},{id:"own",jobId:"job-a"},
   {id:"foreign",jobId:"job-b"}];
  expect(scopeRecruiterConversations(rows,"GENERAL").map(row=>row.id)).toEqual(["general"]);
  expect(scopeRecruiterConversations(rows,"DRIVE").map(row=>row.id)).toEqual(["own","foreign"]);
  expect(onlyUnreadRecruiterThreads(rows,new Set(["foreign"]),"true"==="true")
   .map(row=>row.id)).toEqual(["foreign"]);
  expect(recruiterMessageSearchLimit(["general","own","own"])).toBe(2);
 });
 it("sorts identical timestamps deterministically and does not mutate source rows",()=>{
  const time=new Date("2099-01-01T00:00:00.000Z");
  const rows=[{id:"b",createdAt:time,lastMessageAt:null},
   {id:"a",createdAt:time,lastMessageAt:null}];
  expect(orderRecruiterConversations(rows,"LATEST").map(row=>row.id)).toEqual(["a","b"]);
  expect(rows.map(row=>row.id)).toEqual(["b","a"]);
 });
});
