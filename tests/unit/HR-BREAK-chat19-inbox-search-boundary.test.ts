import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 filterRecruiterConversations,recruiterMessageSearchLimit,
 hrConversationPageBounds,HR_CONVERSATION_PAGE_SIZE,
} from "@/modules/placements/hr-conversation-inbox-model";

describe("HR-BREAK-INBOX-SEARCH-07: employer inbox search must not silently drop later messages",()=>{
 it("uses the exact number of authorized distinct threads rather than a global thousand-row cutoff",()=>{
  const owned=Array.from({length:1205},(_,i)=>"thread-"+i);
  expect(recruiterMessageSearchLimit(owned)).toBe(1205);
  expect(recruiterMessageSearchLimit([...owned,owned[0]!])).toBe(1205);
  expect(recruiterMessageSearchLimit([])).toBe(0);
  expect(recruiterMessageSearchLimit(owned.slice(0,5))).toBe(5);
 });
 it("retains a match in the last authorized thread after 1204 earlier matches",()=>{
  const owned=Array.from({length:1205},(_,i)=>({id:"thread-"+i,jobId:null}));
  const matches=new Set(owned.map(t=>t.id));
  const filtered=filterRecruiterConversations(owned,new Set(),"needle",new Map(),matches);
  expect(filtered).toHaveLength(1205);
  expect(filtered.at(-1)).toEqual({id:"thread-1204",jobId:null});
  expect(HR_CONVERSATION_PAGE_SIZE).toBe(20);
  expect(hrConversationPageBounds(10000,filtered.length)).toMatchObject({
   page:61,pages:61,first:1201,last:1205,
  });
 });
 it("never includes a foreign or unowned message ID in the projected matching thread list",()=>{
  const owned=[{id:"thread-own",jobId:null},{id:"thread-drive",jobId:"job-mine"}];
  const matches=new Set(["thread-own","thread-drive","foreign-thread"]);
  const filtered=filterRecruiterConversations(owned,new Set(["job-mine"]),"needle",new Map(),matches);
  expect(filtered.map(x=>x.id)).toEqual(["thread-own","thread-drive"]);
  expect(filterRecruiterConversations(owned,new Set(),"needle",new Map(),matches))
   .toEqual([{id:"thread-own",jobId:null}]);
 });
 it("keeps SQL match selection scoped to accessibleIds before applying its dynamic limit",()=>{
  const source=readFileSync("src/modules/placements/hr-conversation-inbox-service.ts","utf8");
  expect(source).toContain("inArray(placementTpoMessages.threadId,accessibleIds)");
  expect(source).toContain("recruiterMessageSearchLimit(accessibleIds)");
  expect(source).not.toContain(".limit(1000)");
 });
});
