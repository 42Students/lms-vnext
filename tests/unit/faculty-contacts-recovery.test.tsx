import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {createElement} from "react";
import {AuthorizationError} from "@/modules/permissions/policy";
import {parseFacultyContactsQuery} from "@/modules/courses/faculty-contacts-filter-model";

const mocks=vi.hoisted(()=>({context:vi.fn(),list:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("next/navigation",()=>({
 redirect:(href:string)=>{throw new Error("REDIRECT_TO_"+href);},
 useRouter:()=>({push:vi.fn(),replace:vi.fn(),refresh:vi.fn()}),
}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:mocks.context,
}));
vi.mock("@/modules/courses/faculty-contacts-service",()=>({
 listFacultyContacts:mocks.list,
}));

import FacultyContactsPage from "@/app/(authenticated)/teacher/contacts/[contactsTab]/page";
import FacultyContactsLoading from "@/app/(authenticated)/teacher/contacts/[contactsTab]/loading";
import FacultyContactsError from "@/app/(authenticated)/teacher/contacts/[contactsTab]/error";
import {FacultyContactsRetry} from "@/app/(authenticated)/teacher/contacts/[contactsTab]/faculty-contacts-live-search";

const load=(tab="allContacts",searchParams:Record<string,string|string[]|undefined>={})=>
 FacultyContactsPage({
  params:Promise.resolve({contactsTab:tab}),
  // Deliberately pass duplicated/unknown keys that a real Next URL may supply.
  searchParams:Promise.resolve(searchParams as unknown as {q?:string;page?:string;pageSize?:string}),
 });

beforeEach(()=>{
 vi.resetAllMocks();
 mocks.context.mockResolvedValue({user:{id:"faculty"},membership:{id:"active"}});
 mocks.list.mockResolvedValue({
  tab:"ALL",search:"",page:1,pageSize:10,total:0,totalPages:1,items:[],
 });
});

describe("Faculty Contacts recovery and privacy UI",()=>{
 it("rejects injected or invalid filters before calling the persisted directory",async()=>{
  for(const params of [
   {collegeId:"foreign"},{q:["a","b"]},{pageSize:"500"},{page:"0"},
   {q:"a".repeat(201)},
  ]){
   const html=renderToStaticMarkup(await load("allContacts",params));
   expect(html).toContain("Invalid directory filters");
   expect(html).toContain("Return to Contacts");
   expect(html).not.toContain("Directory results");
  }
  expect(mocks.context).not.toHaveBeenCalled();
  expect(mocks.list).not.toHaveBeenCalled();
 });
 it("renders the real empty state, no false error, and no private fields",async()=>{
  const html=renderToStaticMarkup(await load());
  expect(html).toContain("No contacts found");
  expect(html).toContain("0 contacts");
  expect(html).not.toContain("Couldn't load contacts");
  expect(mocks.list).toHaveBeenCalledWith(expect.anything(),{
   tab:"ALL",search:"",page:1,pageSize:10,
  });
 });
 it("shows actionable retry and nonblocking legacy alert without leaking backend errors",async()=>{
  mocks.list.mockRejectedValueOnce(new Error("sensitive postgres failure detail"));
  const html=renderToStaticMarkup(await load());
  // SSR correctly escapes the apostrophe while the browser renders it as text.
  expect(html).toMatch(/Couldn(?:&#x27;|')t load contacts/);
  expect(html).toContain("Retry contacts");
  expect(html).toContain("Contacts load notification");
  expect(html).not.toContain("sensitive postgres failure detail");
  expect(html).not.toContain("No contacts found");
 });
 it("keeps access denial distinct from transient failure and never shows a retry loop",async()=>{
  mocks.list.mockRejectedValueOnce(new AuthorizationError("courses.read"));
  const html=renderToStaticMarkup(await load("students"));
  expect(html).toContain("Contacts access denied");
  expect(html).toContain("Back to teaching");
  expect(html).not.toContain("Contacts load notification");
  expect(html).not.toContain("Retry contacts");
 });
 it("exposes loading and boundary recovery without mistaking failures for empty",()=>{
  const loading=renderToStaticMarkup(createElement(FacultyContactsLoading));
  const boundary=renderToStaticMarkup(createElement(FacultyContactsError,{
   error:new Error("never expose exception"),reset:()=>{},
  }));
  const retry=renderToStaticMarkup(createElement(FacultyContactsRetry));
  expect(loading).toContain("Loading contacts");
  expect(loading).toContain('aria-busy="true"');
  expect(boundary).toContain("Retry");
  expect(boundary).not.toContain("never expose exception");
  expect(retry).toContain("Retry contacts");
 });
 it("retains only strict, bounded public search and pagination query selectors",()=>{
  expect(parseFacultyContactsQuery({q:"  Ada  ",page:"2",pageSize:"20"}))
   .toEqual({search:"Ada",page:2,pageSize:20});
  expect(parseFacultyContactsQuery({q:"%",page:"1",pageSize:"50"})?.search).toBe("%");
  expect(parseFacultyContactsQuery({q:"Ada",collegeId:"foreign"})).toBeNull();
  expect(parseFacultyContactsQuery({pageSize:"100"})).toBeNull();
 });
});
