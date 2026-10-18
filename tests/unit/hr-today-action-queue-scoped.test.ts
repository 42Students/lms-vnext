import {describe,it,expect} from "vitest";
import {buildRecruiterActionQueue} from "@/modules/placements/hr-today-action-queue-model";
describe("REC-home-drives-01 scoped task queue",()=>{
 const job={collegeId:"college",companyId:"employer",job:{id:"11111111-1111-4111-8111-111111111111",title:"Engineer",status:"PUBLISHED",archivedAt:null}};
 it("orders dated results-due first, then readable conversations and notices, then reviews",()=>{
  const rows=buildRecruiterActionQueue({jobs:[job],collegeId:"college",companyId:"employer",unread:1,
   unreadConversations:[{id:"thread",href:"/hr/conversations/thread",label:"College chat",unread:2}],
   resultsDue:[{id:"round",jobId:"11111111-1111-4111-8111-111111111111",jobTitle:"Engineer",roundName:"Interview",dueAt:new Date("2026-10-18T00:00:00Z")}],
  });
  expect(rows.map(row=>row.key)).toEqual(["due:round","notifications","thread:thread","review:11111111-1111-4111-8111-111111111111"]);
  expect(rows[0]?.description).toContain("does not establish whether results are outstanding");
 });
 it("routes unread system notifications to notifications, not the recruiter Messages conversation alias",()=>{
  const results=buildRecruiterActionQueue({
   jobs:[job],collegeId:"college",companyId:"employer",unread:3,
  });
  const unread=results.find(row=>row.key==="notifications");
  expect(unread).toBeDefined();
  expect(unread?.href).toBe("/hr/notifications?collegeId=college&unreadOnly=true");
  expect(unread?.href).not.toContain("/recruiter/messages");
  expect(unread?.description).toContain("notification inbox");
 });
 it("cannot leak foreign-company or unlinked deadline rows into actions",()=>{
  const rows=buildRecruiterActionQueue({jobs:[job,{...job,companyId:"foreign"}],
    collegeId:"college",companyId:"employer",unread:0,
    resultsDue:[{id:"foreign",jobId:"outside",jobTitle:"Secret",roundName:"Private",dueAt:new Date()}]});
  expect(rows.map(row=>row.key)).toEqual(["review:11111111-1111-4111-8111-111111111111"]);
 });
});
