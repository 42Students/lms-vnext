import {describe,expect,it} from "vitest";
import {isAuthorizedHrBellHref,parseHrBellResponse} from "@/modules/placements/hr-recruiter-bell-model";
import {hrConversationsHref} from "@/modules/placements/hr-conversation-urls-model";
import {readFileSync} from "node:fs";

const id="11111111-1111-4111-8111-111111111111";
const valid={status:"READY",unread:1,items:[{id,label:"Drive updated",unread:true,
 at:"2026-10-18T10:00:00.000Z",href:"/hr/placements/jobs/"+id}]};
describe("HR-BREAK-BELL-PAYLOAD-35 verified HR notification shell response",()=>{
 it("retains authorized job links and unread counts without losing ordinary copy",()=>{
  expect(parseHrBellResponse(valid)).toEqual({...valid,hiddenUnread:0});
  expect(parseHrBellResponse({status:"NO_ACCESS",unread:0,items:[]})).toEqual({
   status:"NO_ACCESS",unread:0,hiddenUnread:0,items:[],
  });
 });
 it.each([
  null,[],{status:"READY",unread:1,items:null},
  {...valid,items:[{...valid.items[0],href:"https://other.example/private"}]},
  {...valid,items:[{...valid.items[0],href:"javascript:alert(1)"}]},
  {...valid,items:[{...valid.items[0],href:"/admin/users/"+id}]},
  {...valid,items:[{...valid.items[0],at:"not-a-date"}]},
  {...valid,items:[{...valid.items[0],unread:"yes"}]},
  {...valid,items:[{...valid.items[0],label:"a".repeat(501)}]},
  {...valid,unread:-1},{...valid,unread:1.5},
  {status:"NO_ACCESS",unread:1,items:valid.items},
 ])("fails closed on malformed, foreign or expired bell data %j",value=>{
  expect(parseHrBellResponse(value)).toBeNull();
 });
 it("HR-BELL-GENERAL accepts generated no-job TPO conversations without hiding the whole bell",()=>{
  const href=hrConversationsHref({collegeId:id,q:"",unreadOnly:"true",page:1});
  expect(href).toBe("/hr/conversations?collegeId="+id+"&q=&unreadOnly=true&page=1&sort=LATEST&scope=ALL");
  expect(isAuthorizedHrBellHref(href)).toBe(true);
  expect(parseHrBellResponse({
    status:"READY",unread:2,items:[
      valid.items[0],
      {id:"m-general",label:"New message",title:"General conversation",
       unread:true,at:"2026-10-18T10:05:00.000Z",href},
    ],
  })).toMatchObject({status:"READY",unread:2,hiddenUnread:0,items:[{}, {href}]});
 });
 it.each([
  "/hr/conversations",
  "/hr/conversations?collegeId="+id,
  "/hr/conversations?collegeId="+id+"&q=&unreadOnly=false&page=1&sort=LATEST&scope=ALL",
  "/hr/conversations?collegeId="+id+"&q=private&unreadOnly=true&page=1&sort=LATEST&scope=ALL",
  "/hr/conversations?collegeId="+id+"&q=&unreadOnly=true&page=2&sort=LATEST&scope=ALL",
  "/hr/conversations?collegeId="+id+"&q=&unreadOnly=true&page=1&sort=OLDEST&scope=ALL",
  "/hr/conversations?collegeId="+id+"&q=&unreadOnly=true&page=1&sort=LATEST&scope=GENERAL",
  "/hr/conversations?collegeId="+id+"&q=&unreadOnly=true&page=1&sort=LATEST&scope=ALL&next=https://evil.example",
  "/hr/conversations?collegeId=not-a-uuid&q=&unreadOnly=true&page=1&sort=LATEST&scope=ALL",
  "/hr/conversations?collegeId="+id+"&q=&unreadOnly=true&page=1&sort=LATEST&scope=ALL#other",
  "//evil.example/hr/conversations?collegeId="+id+"&q=&unreadOnly=true&page=1&sort=LATEST&scope=ALL",
  "/hr/%63onversations?collegeId="+id+"&q=&unreadOnly=true&page=1&sort=LATEST&scope=ALL",
  "/hr/conversations?collegeId="+id+"&q=&unreadOnly=true&page=1&sort=LATEST&scope=ALL%0a",
 ])("HR-BELL-GENERAL rejects forged/ambiguous inbox navigation %s",href=>{
  expect(isAuthorizedHrBellHref(href)).toBe(false);
  expect(parseHrBellResponse({...valid,items:[{...valid.items[0],href}]})).toBeNull();
 });
 it("wires strict parsing before setting any HR shell notification state",()=>{
  const source=readFileSync("src/components/hr/hr-recruiter-bell.tsx","utf8");
  expect(source).toContain("const data=parseHrBellResponse(payload)");
  expect(source).toContain('if(!data)throw Error("INVALID_BELL_RESPONSE")');
  expect(source).toContain("if(authorizationLost){setState(null);setBadgeUnread(null);}");
  expect(source).toContain("setError(authorizationLost");
 });
});
