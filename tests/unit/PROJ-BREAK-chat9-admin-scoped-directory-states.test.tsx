import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import type {SuperAdminReadResult} from "@/modules/admin-ui/super-admin-read-directory-model";

const state=vi.hoisted(()=>({
  role:"ADMIN" as "ADMIN"|"COLLEGE"|"DISABLED",
  selected:true,contextReads:0,loaderCalls:0,
  fail:"" as ""|"PRIMARY"|"SUSPENDED",
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>{
    state.contextReads++;
    return {
      user:{id:"actor",identityUid:"platform",
        platformStatus:state.role==="DISABLED"?"DISABLED":"ACTIVE",
        systemRoles:state.role==="COLLEGE"?[]:["SUPER_ADMIN"]},
      membership:null,
      adminScope:state.selected?{collegeId:"11111111-1111-4111-8111-111111111111",
        organizationId:"22222222-2222-4222-8222-222222222222"}:null,
    };
  },
}));
function display(value:unknown):string[]{
  if(value===null||value===undefined||typeof value==="boolean")return [];
  if(typeof value==="string"||typeof value==="number")return [String(value)];
  if(Array.isArray(value))return value.flatMap(display);
  if(!isValidElement(value))return [];
  const p=value.props as Record<string,unknown>;
  return ["children","title","description","href","action"].flatMap(key=>display(p[key]));
}
const loader=async(raw:unknown):Promise<SuperAdminReadResult>=>{
  state.loaderCalls++;
  const query=raw as SuperAdminReadResult["query"];
  if(state.fail==="PRIMARY"||(state.fail==="SUSPENDED"&&query.status==="SUSPENDED"))
    throw Error("PRIVATE_DIRECTORY_DB_PASSWORD");
  return {items:[],query,total:0,totalPages:1};
};
const render=(raw:Record<string,string|string[]|undefined>={},people=false)=>
  AdminScopedReadPage({
    title:"Registered Students",path:"/admin/students",description:"Scoped list",
    statuses:["ALL","ACTIVE","SUSPENDED","ENDED"],
    searchParams:Promise.resolve(raw),loader,
    ...(people?{peopleFilters:{kind:"LEARNER" as const,
      departments:[],programs:[],batches:[],classes:[]}}:{}),
  });
beforeEach(()=>{
  state.role="ADMIN";state.selected=true;state.contextReads=0;
  state.loaderCalls=0;state.fail="";
});
describe("Super Admin last-third shared scoped directories: no false empties or leaked errors",()=>{
  it("UX-admin-directory-101 malformed repeated URLs reject before context/PII reads",async()=>{
    const message=display(await render({q:["own","other"]})).join(" ");
    expect(message).toContain("Invalid directory filters");
    expect(message).toContain("Clear filters");
    expect(state.contextReads).toBe(0);
    expect(state.loaderCalls).toBe(0);
  });
  it("UX-admin-directory-102 expired and college-only roles never invoke student directory loader",async()=>{
    for(const role of ["DISABLED","COLLEGE"] as const){
      state.role=role;
      const message=display(await render()).join(" ");
      expect(message).toContain("Directory access denied");
      expect(message).toContain("Back to dashboard");
    }
    expect(state.loaderCalls).toBe(0);
  });
  it("UX-admin-directory-103 missing selected college does not infer a default tenant",async()=>{
    state.selected=false;
    const message=display(await render()).join(" ");
    expect(message).toContain("Select a college to continue");
    expect(state.loaderCalls).toBe(0);
  });
  it("UX-admin-directory-104 essential load outage preserves validated filters and does not render zero matching results",async()=>{
    state.fail="PRIMARY";
    const message=display(await render({q:"IIT Dharwad",status:"ACTIVE",page:"2",pageSize:"50"})).join(" ");
    expect(message).toContain("Directory unavailable");
    expect(message).toContain("Retry loading directory");
    expect(message).toContain("q=IIT+Dharwad");
    expect(message).toContain("status=ACTIVE");
    expect(message).toContain("page=2");
    expect(message).toContain("pageSize=50");
    expect(message).not.toContain("No matching records");
    expect(message).not.toContain("PRIVATE_DIRECTORY_DB_PASSWORD");
    expect(state.loaderCalls).toBe(1);
  });
  it("UX-admin-directory-105 optional summary failure keeps filtered primary records reachable",async()=>{
    state.fail="SUSPENDED";
    const message=display(await render({},true)).join(" ");
    expect(message).toContain("Directory totals are temporarily unavailable.");
    expect(message).toContain("The filtered records below remain visible.");
    expect(message).toContain("No matching records");
    expect(message).not.toContain("PRIVATE_DIRECTORY_DB_PASSWORD");
    expect(state.loaderCalls).toBe(4);
  });
  it("UX-admin-directory-106 legitimate empty list remains a distinct zero-state",async()=>{
    const message=display(await render()).join(" ");
    expect(message).toContain("No matching records");
    expect(message).not.toContain("Directory unavailable");
    expect(state.loaderCalls).toBe(1);
  });
});
