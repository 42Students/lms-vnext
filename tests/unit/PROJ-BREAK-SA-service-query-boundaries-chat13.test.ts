import {describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import type {ProjectAdminQuery} from "@/modules/projects/admin-insights-service";

const mocks=vi.hoisted(()=>({getDb:vi.fn(),loadProjectCollegeScope:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/projects/scope",()=>({loadProjectCollegeScope:mocks.loadProjectCollegeScope}));

import {listProjectAdminRiskQueue,listProjectAdminSnapshots} from "@/modules/projects/admin-insights-service";

const actor:RequestContext={
  user:{id:"admin",identityUid:"admin-identity",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  adminScope:{organizationId:"org-a",collegeId:"college-a"},
  membership:null,
};
const calls=[
  ["snapshots",listProjectAdminSnapshots],
  ["risk queue",listProjectAdminRiskQueue],
] as const;
describe("PROJ-BREAK-SA-33 service-level Super Admin project query validation",()=>{
  for(const [name,read] of calls){
    it("rejects invalid paging and extra keys before selecting "+name,async()=>{
      for(const query of [
        {page:"0"},{page:"-1"},{page:"0x10"},{page:"1e2"},
        {page:" "},{page:[]},{page:null},{page:"1.5"},
        {pageSize:"0x20"},{pageSize:"1e2"},{pageSize:"101"},
        {pageSize:" "},{pageSize:1000},{page:100001},
        {q:"a".repeat(121)}, {status:"OTHER_TENANT"},
        {page:1,organizationId:"other-org"}, {page:1,private:true},
      ]){
        mocks.getDb.mockClear();
        mocks.loadProjectCollegeScope.mockClear();
        await expect(read(actor,"college-a",query as unknown as ProjectAdminQuery),JSON.stringify(query)).rejects.toThrow();
        expect(mocks.getDb).not.toHaveBeenCalled();
        expect(mocks.loadProjectCollegeScope).not.toHaveBeenCalled();
      }
    });
  }
});
